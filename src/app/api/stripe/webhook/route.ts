import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase, FundItem } from '@/models';
import { createContribution } from '@/lib/api';

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
  // Check if Stripe is initialized
  if (!stripe || !endpointSecret) {
    console.error('Stripe or webhook secret is not initialized. Check your environment variables.');
    return NextResponse.json(
      { error: 'Stripe is not configured properly. Please contact the administrator.' },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract metadata
    const { campaignId, userId, message, anonymous } = session.metadata || {};
    const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents to dollars

    if (campaignId && userId) {
      try {
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
          console.error(`Campaign not found: ${campaignId}`);
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Create the contribution
        const contribution = {
          campaignId,
          contributorId: userId,
          amount,
          message: message || '',
          anonymous: anonymous === 'true',
          status: 'completed',
          stripeSessionId: session.id,
          createdAt: new Date().toISOString(),
        };

        // Save the contribution
        await createContribution(contribution);

        // Update the campaign's current amount
        campaign.currentAmount = (campaign.currentAmount || 0) + amount;
        await campaign.save();

        console.log(`Successfully processed payment for campaign ${campaignId}`);
      } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
