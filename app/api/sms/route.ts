import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// Helper to verify Firebase token
async function verifyAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

// GET - Fetch SMS messages for user's phone numbers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's phone numbers first
    const numbersSnapshot = await adminDb
      .collection('phoneNumbers')
      .where('userId', '==', user.uid)
      .get();

    const phoneNumberIds = numbersSnapshot.docs.map((doc) => doc.id);

    if (phoneNumberIds.length === 0) {
      return NextResponse.json([]);
    }

    // TODO: Poll third-party SMS API for new messages
    // Example API call structure (adjust based on your provider):
    /*
    const messages = [];
    for (const phoneDoc of numbersSnapshot.docs) {
      const phoneData = phoneDoc.data();
      
      // Check for new SMS from API
      const response = await fetch(`${process.env.SMS_API_URL}/getStatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationId: phoneData.activationId,
        }),
      });

      const data = await response.json();
      
      if (data.status === 'OK' && data.sms) {
        // Store new SMS in Firestore
        const smsData = {
          phoneNumberId: phoneDoc.id,
          from: data.sender || 'Unknown',
          message: data.sms,
          receivedAt: new Date().toISOString(),
        };
        
        const smsDoc = await adminDb.collection('smsMessages').add(smsData);
        messages.push({ id: smsDoc.id, ...smsData });
      }
    }
    */

    // Fetch stored SMS messages from Firestore
    const smsSnapshot = await adminDb
      .collection('smsMessages')
      .where('phoneNumberId', 'in', phoneNumberIds)
      .orderBy('receivedAt', 'desc')
      .limit(50)
      .get();

    const messages = smsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching SMS:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
