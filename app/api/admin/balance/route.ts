import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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
    
    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get DaisySMS API key from environment
    const apiKey = process.env.DAISYSMS_API_KEY;
    const apiUrl = process.env.DAISYSMS_API_URL || 'https://daisysms.com/stubs/handler_api.php';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Call DaisySMS getBalance API
    const daisyUrl = `${apiUrl}?api_key=${apiKey}&action=getBalance`;
    console.log('🔵 [DaisySMS] Calling API:', daisyUrl.replace(apiKey, '***HIDDEN***'));
    
    const response = await fetch(daisyUrl);
    const data = await response.text();
    
    console.log('🔵 [DaisySMS] Response:', data);

    // Parse response: ACCESS_BALANCE:50.30 or BAD_KEY
    if (data.startsWith('BAD_KEY')) {
      return NextResponse.json({ 
        error: 'Invalid API key',
        balance: 0,
        status: 'error'
      }, { status: 500 });
    }

    if (data.startsWith('ACCESS_BALANCE:')) {
      const balance = parseFloat(data.split(':')[1]);
      
      // Cache balance in Firestore (optional)
      await adminDb.collection('adminConfig').doc('apiBalance').set({
        balance,
        lastUpdated: new Date().toISOString(),
        status: balance < 50 ? 'low' : 'ok'
      }, { merge: true });

      return NextResponse.json({
        balance,
        status: balance < 50 ? 'low' : 'ok',
        lastUpdated: new Date().toISOString()
      });
    }

    // Unexpected response
    return NextResponse.json({ 
      error: 'Unexpected API response',
      balance: 0,
      status: 'error'
    }, { status: 500 });

  } catch (error: any) {
    console.error('Error fetching DaisySMS balance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch balance',
      message: error.message 
    }, { status: 500 });
  }
}
