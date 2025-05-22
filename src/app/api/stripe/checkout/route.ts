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
}

export async function POST(request: Request) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
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
      // Continue to next lookup method
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

    // Always use a known working image URL for Stripe
    // Stripe requires fully qualified URLs that are publicly accessible
    const imageUrl = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop';

    // Create a Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
    const successUrl = `${baseUrl}/foundfund/payment/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}&amount=${amount}&user_id=${userId}&message=${encodeURIComponent(message || '')}&anonymous=${anonymous || false}&campaign_name=${encodeURIComponent(campaign.name)}`;
    const cancelUrl = `${baseUrl}/foundfund/projects/${campaignId}?payment_canceled=true`;

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        campaignId,
        userId,
        message: message || '',
        anonymous: anonymous ? 'true' : 'false',
        campaignName: campaign.name,
        amount: amount.toString(),
        timestamp: new Date().toISOString(),
      },
    });



    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
