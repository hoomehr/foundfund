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
  console.log('Stripe webhook received');

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
    console.log(`Webhook event type: ${event.type}`);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Checkout session completed:', session.id);

    // Extract metadata
    const { campaignId, userId, message, anonymous } = session.metadata || {};
    const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents to dollars

    if (!campaignId || !userId) {
      console.error('Missing required metadata:', { campaignId, userId });
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
    }

    console.log(`Processing payment: Campaign=${campaignId}, User=${userId}, Amount=${amount}`);

    try {
      // Connect to database
      await connectToDatabase();
      console.log('Connected to database');

      // ULTRA SIMPLE APPROACH - JUST DO IT DIRECTLY
      console.log('ULTRA SIMPLE APPROACH - JUST DO IT DIRECTLY');

      try {
        // 1. Check if contribution already exists
        console.log(`Checking for existing contribution with session ID: ${session.id}`);
        const existingContribution = await mongoose.connection.db.collection('contributions').findOne({
          stripeSessionId: session.id
        });

        if (existingContribution) {
          console.log(`Contribution already exists: ${existingContribution._id}`);
          return NextResponse.json({ success: true, message: 'Contribution already exists' });
        }

        // 2. Create contribution
        console.log('Creating new contribution...');
        const contributionId = uuidv4();
        const contributionData = {
          _id: new mongoose.Types.ObjectId(),
          id: contributionId,
          fundItemId: campaignId,
          userId: userId,
          amount: amount,
          message: message || '',
          anonymous: anonymous === 'true',
          status: 'completed',
          stripeSessionId: session.id,
          createdAt: new Date()
        };

        console.log('Contribution data:', contributionData);

        // Insert contribution
        const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);
        console.log('Contribution created with ID:', result.insertedId);

        // 3. Update campaign
        console.log(`Updating campaign ${campaignId} with amount ${amount}`);

        // Find campaign
        const campaign = await mongoose.connection.db.collection('funditems').findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
            { id: campaignId }
          ]
        });

        if (!campaign) {
          console.error(`Campaign not found: ${campaignId}`);
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        console.log(`Found campaign: ${campaign.name}`);

        // Check if this is a new contributor
        const previousContributions = await mongoose.connection.db.collection('contributions').find({
          $or: [
            { fundItemId: campaignId, userId: userId },
            { campaignId: campaignId, contributorId: userId }
          ],
          _id: { $ne: contributionData._id }
        }).toArray();

        const isNewContributor = previousContributions.length === 0;
        console.log(`Is new contributor: ${isNewContributor}`);

        // Update campaign
        const updateResult = await mongoose.connection.db.collection('funditems').updateOne(
          { _id: campaign._id },
          {
            $inc: {
              currentAmount: amount,
              contributionsCount: 1,
              uniqueContributorsCount: isNewContributor ? 1 : 0
            },
            $set: {
              status: (campaign.currentAmount + amount >= campaign.fundingGoal) ? 'funded' : campaign.status
            }
          }
        );

        console.log('Campaign update result:', updateResult);

        return NextResponse.json({
          success: true,
          message: 'Contribution created and campaign updated',
          contributionId: contributionId,
          campaignId: campaignId,
          amount: amount
        });
      } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
      return NextResponse.json({ error: 'Error connecting to database' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
