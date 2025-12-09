import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { emitCreditUpdate, emitTransaction } from '@/lib/socket';

// POST - Add credits to user account
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, note } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Use Firestore transaction to ensure atomicity
    const result = await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(id);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentCredits = userData?.credits || 0;
      const newCredits = currentCredits + amount;

      // Update user credits
      transaction.update(userRef, {
        credits: newCredits,
        updatedAt: new Date().toISOString(),
      });

      // Create transaction record
      const transactionRef = adminDb.collection('transactions').doc();
      const transactionData = {
        userId: id,
        type: amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(amount),
        balanceBefore: currentCredits,
        balanceAfter: newCredits,
        description: amount > 0 ? 'Admin added credits' : 'Admin deducted credits',
        metadata: {
          adminId: admin.uid,
          adminNote: note || '',
        },
        createdAt: new Date().toISOString(),
      };
      transaction.set(transactionRef, transactionData);

      return {
        id: userDoc.id,
        ...userData,
        credits: newCredits,
        transactionId: transactionRef.id,
        transactionData,
      };
    });

    // Emit real-time update via WebSocket
    try {
      emitCreditUpdate(id, result.credits);
      emitTransaction(id, result.transactionData);
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
      // Continue even if socket fails
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding credits:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
