import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get activation ID from query params
    const { searchParams } = new URL(request.url);
    const activationId = searchParams.get('id');

    if (!activationId) {
      return NextResponse.json({ error: 'Activation ID is required' }, { status: 400 });
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

    // Get DaisySMS API credentials
    const apiKey = process.env.DAISYSMS_API_KEY;
    const apiUrl = process.env.DAISYSMS_API_URL || 'https://daisysms.com/stubs/handler_api.php';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Call DaisySMS getStatus API with text=1 to get full message
    const daisyUrl = `${apiUrl}?api_key=${apiKey}&action=getStatus&id=${activationId}&text=1`;
    console.log('🔵 [DaisySMS] Polling SMS for activation:', activationId);
    
    const response = await fetch(daisyUrl);
    const data = await response.text();
    const fullText = response.headers.get('X-Text');
    
    console.log('🔵 [DaisySMS] SMS Status:', data, 'Full Text:', fullText);

    // Parse response
    if (data.startsWith('STATUS_OK:')) {
      // Got the code
      const code = data.split(':')[1];
      
      // Store message in Firestore
      const activationDoc = activationSnapshot.docs[0];
      const messageRef = adminDb.collection('messages').doc();
      
      await messageRef.set({
        activationId,
        userId,
        code,
        text: fullText || '',
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update activation status
      await activationDoc.ref.update({
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        status: 'ok',
        code,
        text: fullText || '',
        receivedAt: new Date().toISOString(),
      });
    }

    if (data === 'STATUS_WAIT_CODE') {
      return NextResponse.json({
        status: 'waiting',
        message: 'Waiting for SMS...',
      });
    }

    if (data === 'STATUS_CANCEL') {
      // Update activation status
      const activationDoc = activationSnapshot.docs[0];
      await activationDoc.ref.update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        status: 'cancelled',
        message: 'Rental was cancelled',
      });
    }

    if (data === 'NO_ACTIVATION') {
      return NextResponse.json({ 
        status: 'error',
        error: 'Activation not found' 
      }, { status: 404 });
    }

    // Unknown status
    return NextResponse.json({
      status: 'unknown',
      data,
    });

  } catch (error) {
    console.error('Error polling SMS:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to poll SMS',
      message 
    }, { status: 500 });
  }
}
