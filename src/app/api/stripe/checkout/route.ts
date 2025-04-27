import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase, FundItem } from '@/models';

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe with the secret key if available
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
} else {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      console.error('Stripe is not initialized. Check your environment variables.');
      return NextResponse.json(
        { error: 'Stripe is not configured properly. Please contact the administrator.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { campaignId, amount, userId, message, anonymous } = body;

    if (!campaignId || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find the campaign
    let campaign;
    try {
      campaign = await FundItem.findById(campaignId);
    } catch (error) {
      console.log(`Error finding campaign by _id:`, error.message);
    }

    // If not found by _id, try to find by id field
    if (!campaign) {
      campaign = await FundItem.findOne({ id: campaignId });
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Debug campaign data
    console.log('Campaign data:', {
      id: campaign.id,
      name: campaign.name,
      imageUrl: campaign.imageUrl,
      description: campaign.description?.substring(0, 100) + '...'
    });

    // Always use a known working image URL for Stripe
    // Stripe requires fully qualified URLs that are publicly accessible
    const imageUrl = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop';

    console.log(`Using image URL for Stripe: ${imageUrl}`);

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Contribution to ${campaign.name}`,
              description: `Supporting ${campaign.name} on FoundFund`,
              images: [imageUrl],
            },
            unit_amount: amount * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/foundfund/payment/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}&amount=${amount}&user_id=${userId}&message=${encodeURIComponent(message || '')}&anonymous=${anonymous || false}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/foundfund/projects/${campaignId}?payment_canceled=true`,
      metadata: {
        campaignId,
        userId,
        message: message || '',
        anonymous: anonymous ? 'true' : 'false',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
