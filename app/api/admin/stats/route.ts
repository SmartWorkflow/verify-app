import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users count
    const usersSnapshot = await adminDb.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get active users (status = 'active')
    const activeUsersSnapshot = await adminDb
      .collection('users')
      .where('status', '==', 'active')
      .count()
      .get();
    const activeUsers = activeUsersSnapshot.data().count;

    // Get total credits in circulation
    const allUsersSnapshot = await adminDb.collection('users').get();
    let totalCredits = 0;
    allUsersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalCredits += data.credits || 0;
    });

    // Get recent transactions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentTransactionsSnapshot = await adminDb
      .collection('transactions')
      .where('createdAt', '>', oneDayAgo)
      .count()
      .get();
    const recentTransactions = recentTransactionsSnapshot.data().count;

    const stats = {
      totalUsers,
      activeUsers,
      totalCredits,
      recentTransactions,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
