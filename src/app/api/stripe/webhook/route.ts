import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { connectToDatabase, FundItem, Contribution } from '@/models';
import { v4 as uuidv4 } from 'uuid';

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
  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);

  // Log headers (excluding sensitive information)
  const headers = {};
  request.headers.forEach((value, key) => {
    if (key !== 'stripe-signature') {
      headers[key] = value;
    } else {
      headers[key] = value.substring(0, 10) + '...';
    }
  });
  console.log('Request headers:', headers);

  // Check if Stripe is initialized
  if (!stripe || !endpointSecret) {
    console.error('❌ Stripe or webhook secret is not initialized. Check your environment variables.');
    console.error('STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
    console.error('STRIPE_WEBHOOK_SECRET present:', !!process.env.STRIPE_WEBHOOK_SECRET);
    return NextResponse.json(
      { error: 'Stripe is not configured properly. Please contact the administrator.' },
      { status: 500 }
    );
  }

  const payload = await request.text();
  console.log('Payload length:', payload.length);

  const signature = request.headers.get('stripe-signature') || '';
  console.log('Signature present:', !!signature);

  let event;

  try {
    console.log('Constructing Stripe event from webhook payload...');
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    console.log('✅ Webhook event constructed successfully');
    console.log(`Event type: ${event.type}`);
    console.log(`Event ID: ${event.id}`);
    console.log(`Event created: ${new Date(event.created * 1000).toISOString()}`);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('Error details:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('=== CHECKOUT SESSION COMPLETED ===');
    console.log('Session ID:', session.id);
    console.log('Session object:', JSON.stringify(session, null, 2));

    // Extract metadata
    const metadata = session.metadata || {};
    console.log('Session metadata:', metadata);

    const campaignId = metadata.campaignId;
    const userId = metadata.userId;
    const message = metadata.message;
    const anonymous = metadata.anonymous;

    const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents to dollars
    console.log('Amount (in dollars):', amount);

    if (!campaignId || !userId) {
      console.error('❌ Missing required metadata:');
      console.error('  campaignId:', campaignId);
      console.error('  userId:', userId);
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
    }

    console.log('✅ All required metadata present');
    console.log(`Processing payment: Campaign=${campaignId}, User=${userId}, Amount=${amount}, Message=${message}, Anonymous=${anonymous}`);

    try {
      // Connect to database
      console.log('Connecting to database...');
      try {
        await connectToDatabase();
        console.log('✅ Connected to database');

        // Check MongoDB connection state
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      } catch (dbError) {
        console.error('❌ Error connecting to database:', dbError);
        return NextResponse.json({ error: 'Error connecting to database' }, { status: 500 });
      }

      console.log('=== PROCESSING PAYMENT WITH PAYMENT HANDLER ===');

      try {
        // Import the payment handler
        const { handleSuccessfulPayment } = await import('@/lib/payment-handler');

        // Process the payment using our robust payment handler
        const result = await handleSuccessfulPayment({
          sessionId: session.id,
          campaignId,
          userId,
          amount,
          message: message || '',
          anonymous: anonymous === 'true'
        });

        console.log('Payment handler result:', result.created ? 'Created new contribution' : 'Found existing contribution');
        console.log('\n=== WEBHOOK PROCESSING COMPLETED SUCCESSFULLY ===');

        return NextResponse.json({
          success: true,
          message: result.created ? 'Contribution created and campaign updated' : 'Contribution already exists',
          contribution: result.contribution,
          campaign: result.campaign,
          created: result.created
        });
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
      }
    } catch (error) {
      console.error('❌ Error in webhook handler:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
