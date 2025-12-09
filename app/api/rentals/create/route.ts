import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { service, price } = body;

    if (!service || !price) {
      return NextResponse.json({ error: 'Service and price are required' }, { status: 400 });
    }

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentBalance = userData?.credits || 0;

    // Check if user has enough balance (based on your site's price, not DaisySMS price)
    if (currentBalance < price) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        balance: currentBalance,
        required: price,
        shortfall: price - currentBalance
      }, { status: 400 });
    }

    // Get DaisySMS API key
    const apiKey = process.env.DAISYSMS_API_KEY;
    const apiUrl = process.env.DAISYSMS_API_URL || 'https://daisysms.com/stubs/handler_api.php';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Build DaisySMS API URL with proper parameters
    // Convert your site's price (in taka) to dollars for max_price
    // Assuming 1 USD = 100 Taka (adjust based on your conversion rate)
    const maxPriceInDollars = (price / 100).toFixed(2);
    const daisyUrl = `${apiUrl}?api_key=${apiKey}&action=getNumber&service=${service}&max_price=${maxPriceInDollars}`;
    
    console.log('🔵 [DaisySMS] Calling getNumber API:', {
      service,
      maxPrice: maxPriceInDollars,
      url: daisyUrl.replace(apiKey, '***HIDDEN***')
    });
    
    const response = await fetch(daisyUrl);
    const data = await response.text();
    
    console.log('🔵 [DaisySMS] Response:', data);

    // Parse response
    if (data.startsWith('ACCESS_NUMBER:')) {
      // Format: ACCESS_NUMBER:activationId:phoneNumber
      const parts = data.split(':');
      const activationId = parts[1];
      const phoneNumber = parts[2];

      // Get actual price from header if available (DaisySMS API price - for logging only)
      const actualPrice = response.headers.get('X-Price');
      const apiPricePaid = actualPrice ? parseFloat(actualPrice) : 0;

      // Use YOUR site's price for charging the user, not DaisySMS price
      // Deduct balance using Firestore transaction
      await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection('users').doc(userId);
        const userSnapshot = await transaction.get(userRef);
        
        if (!userSnapshot.exists) {
          throw new Error('User not found');
        }

        const userData = userSnapshot.data();
        const currentCredits = userData?.credits || 0;

        if (currentCredits < price) {
          throw new Error('Insufficient balance');
        }

        const newBalance = currentCredits - price;

        // Update user balance
        transaction.update(userRef, {
          credits: newBalance,
          updatedAt: new Date().toISOString(),
        });

        // Create activation record
        const activationRef = adminDb.collection('activations').doc();
        transaction.set(activationRef, {
          userId,
          activationId,
          phoneNumber,
          service,
          status: 'active',
          priceCharged: price, // Your site's price (what user pays)
          apiPricePaid: apiPricePaid, // DaisySMS price (what you pay)
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes
        });

        // Create transaction record
        const transactionRef = adminDb.collection('transactions').doc();
        transaction.set(transactionRef, {
          userId,
          type: 'debit',
          amount: -price,
          balanceBefore: currentCredits,
          balanceAfter: newBalance,
          description: `Rented number for ${service}`,
          activationId,
          createdAt: new Date().toISOString(),
        });
      });

      return NextResponse.json({
        success: true,
        activationId,
        phoneNumber,
        service,
        priceCharged: price,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      });
    }

    // Handle error responses
    if (data === 'NO_NUMBERS') {
      return NextResponse.json({ error: 'No numbers available for this service at the moment' }, { status: 503 });
    }

    if (data === 'NO_MONEY') {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    if (data === 'MAX_PRICE_EXCEEDED') {
      return NextResponse.json({ error: 'Service price has increased. Please try again or contact support.' }, { status: 503 });
    }

    if (data === 'TOO_MANY_ACTIVE_RENTALS') {
      return NextResponse.json({ error: 'You have too many active rentals. Please complete or cancel existing rentals first.' }, { status: 429 });
    }

    if (data === 'BAD_SERVICE') {
      return NextResponse.json({ error: 'Invalid service code' }, { status: 400 });
    }

    if (data === 'BAD_KEY') {
      return NextResponse.json({ error: 'Service configuration error. Please contact support.' }, { status: 500 });
    }

    // Unknown error
    return NextResponse.json({ 
      error: 'Failed to rent number. Please try again.',
      details: data
    }, { status: 500 });

  } catch (error: any) {
    console.error('Error creating rental:', error);
    return NextResponse.json({ 
      error: 'Failed to create rental',
      message: error.message 
    }, { status: 500 });
  }
}
