import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';
import { cookies } from 'next/headers';

export async function verifyAdmin(request: NextRequest) {
  console.log('========== VERIFY ADMIN CALLED ==========');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  console.log('[verifyAdmin] Token found:', !!token);

  if (!token) {
    console.log('[verifyAdmin] No auth token found');
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('[verifyAdmin] Decoded UID:', decodedToken.uid);

    // Check if user has admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    console.log('[verifyAdmin] userData:', userData);
    if (userData) {
      console.log('[verifyAdmin] userData.role:', userData.role);
    }

    if (!userData || userData.role !== 'admin') {
      console.log('[verifyAdmin] Access denied: Not admin or no user data');
      return null;
    }

    return decodedToken;
  } catch (error) {
    console.log('[verifyAdmin] Error:', error);
    return null;
  }
}
