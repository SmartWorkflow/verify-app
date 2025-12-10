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
    const activationSnapshot = await adminDb
      .collection('activations')
      .where('userId', '==', userId)
      .where('activationId', '==', activationId)
      .limit(1)
      .get();

    if (activationSnapshot.empty) {
      return NextResponse.json({ error: 'Activation not found' }, { status: 404 });
    }

    // Fetch messages for this activation
    console.log('🔍 [Messages API] Querying messages for activationId:', activationId);
    
    // Try without orderBy first in case index is missing
    let messagesSnapshot;
    try {
      messagesSnapshot = await adminDb
        .collection('messages')
        .where('activationId', '==', activationId)
        .orderBy('receivedAt', 'desc')
        .get();
    } catch {
      // Fallback without orderBy if index doesn't exist
      messagesSnapshot = await adminDb
        .collection('messages')
        .where('activationId', '==', activationId)
        .get();
    }

    const messages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        activationId: data.activationId,
        code: data.code,
        text: data.text,
        userId: data.userId,
        receivedAt: data.receivedAt?.toDate ? data.receivedAt.toDate().toISOString() : data.receivedAt,
        createdAt: data.createdAt,
      };
    });

    // Sort in memory if we couldn't use orderBy
    messages.sort((a, b) => {
      const dateA = new Date(a.receivedAt || 0).getTime();
      const dateB = new Date(b.receivedAt || 0).getTime();
      return dateB - dateA;
    });

    // Remove duplicates based on code - keep only the most recent one
    const uniqueMessages = messages.filter((msg, index, self) => 
      index === self.findIndex((m) => m.code === msg.code)
    );

    return NextResponse.json(uniqueMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
