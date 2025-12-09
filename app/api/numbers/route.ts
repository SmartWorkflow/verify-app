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

// GET - Fetch user's phone numbers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch numbers from Firestore
    const numbersRef = adminDb.collection('phoneNumbers');
    const snapshot = await numbersRef
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const numbers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(numbers);
  } catch (error) {
    console.error('Error fetching numbers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Request a new phone number
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service } = body;

    if (!service) {
      return NextResponse.json({ error: 'Service is required' }, { status: 400 });
    }

    // TODO: Call third-party SMS API to request a number
    // Example API call structure (adjust based on your provider):
    /*
    const response = await fetch(`${process.env.SMS_API_URL}/getNumber`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: service,
        country: 'US', // or allow user to select
      }),
    });

    const data = await response.json();
    const phoneNumber = data.number;
    const activationId = data.activationId;
    */

    // Mock data for now - replace with actual API response
    const phoneNumber = '+1' + Math.floor(1000000000 + Math.random() * 9000000000);
    const activationId = 'mock-' + Date.now();

    // Store in Firestore
    const numberData = {
      userId: user.uid,
      number: phoneNumber,
      service: service,
      status: 'active',
      activationId: activationId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };

    const docRef = await adminDb.collection('phoneNumbers').add(numberData);

    return NextResponse.json({
      id: docRef.id,
      ...numberData,
    });
  } catch (error) {
    console.error('Error requesting number:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
