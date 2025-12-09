import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { emitCreditUpdate, emitTransaction } from '@/lib/socket';

// POST - Add credits to multiple users at once
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, amount, note } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const results = {
      successful: [] as string[],
      failed: [] as { userId: string; error: string }[],
    };

    // Process each user in a transaction
    for (const userId of userIds) {
      try {
        const result = await adminDb.runTransaction(async (transaction) => {
          const userRef = adminDb.collection('users').doc(userId);
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
            userId,
            type: amount > 0 ? 'credit' : 'debit',
            amount: Math.abs(amount),
            balanceBefore: currentCredits,
            balanceAfter: newCredits,
            description: amount > 0 ? 'Admin bulk credit addition' : 'Admin bulk credit deduction',
            metadata: {
              adminId: admin.uid,
              adminNote: note || '',
              bulkOperation: true,
            },
            createdAt: new Date().toISOString(),
          };
          transaction.set(transactionRef, transactionData);

          return {
            userId,
            newCredits,
            transactionData,
          };
        });

        // Emit real-time update via WebSocket
        try {
          emitCreditUpdate(userId, result.newCredits);
          emitTransaction(userId, result.transactionData);
        } catch (socketError) {
          console.error('Socket emit error:', socketError);
          // Continue even if socket fails
        }

        results.successful.push(userId);
      } catch (error: any) {
        console.error(`Error updating user ${userId}:`, error);
        results.failed.push({
          userId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${results.successful.length} of ${userIds.length} users`,
      results,
    });
  } catch (error: any) {
    console.error('Error processing bulk credits:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
