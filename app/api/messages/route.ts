import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const activationId = searchParams.get('activationId');

    if (!activationId) {
      return NextResponse.json({ error: 'Activation ID required' }, { status: 400 });
    }

    // Verify the activation belongs to the user
    const activationDoc = await adminDb
      .collection('activations')
      .doc(activationId)
      .get();

    if (!activationDoc.exists) {
      return NextResponse.json({ error: 'Activation not found' }, { status: 404 });
    }

    if (activationDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to activation' }, { status: 403 });
    }

    // Fetch messages for this activation
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('activationId', '==', activationId)
      .orderBy('receivedAt', 'desc')
      .get();

    const messages = messagesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      receivedAt: doc.data().receivedAt?.toDate().toISOString()
    }));

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
