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
    console.log('🔍 [Messages API] Looking up activation for userId:', userId, 'activationId:', activationId);
    const activationSnapshot = await adminDb
      .collection('activations')
      .where('userId', '==', userId)
      .where('activationId', '==', activationId)
      .limit(1)
      .get();

    if (activationSnapshot.empty) {
      console.error('❌ [Messages API] Activation not found for userId:', userId, 'activationId:', activationId);
      return NextResponse.json({ error: 'Activation not found' }, { status: 404 });
    }

    console.log('✅ [Messages API] Activation found');

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
    } catch (orderByError: any) {
      console.warn('⚠️ [Messages API] OrderBy failed, trying without:', orderByError.message);
      // Fallback without orderBy if index doesn't exist
      messagesSnapshot = await adminDb
        .collection('messages')
        .where('activationId', '==', activationId)
        .get();
    }

    console.log('📊 [Messages API] Found', messagesSnapshot.docs.length, 'messages');

    const messages = messagesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      console.log('📝 [Messages API] Message data:', { id: doc.id, code: data.code, text: data.text?.substring(0, 50) });
      return {
        id: doc.id,
        ...data,
        receivedAt: data.receivedAt?.toDate ? data.receivedAt.toDate().toISOString() : data.receivedAt
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

    console.log('✨ [Messages API] Returning', uniqueMessages.length, 'unique messages');

    return NextResponse.json(uniqueMessages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
