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

      // STEP 1: Check if contribution already exists
      console.log(`Checking for existing contribution with session ID: ${session.id}`);
      const existingContribution = await Contribution.findOne({ stripeSessionId: session.id });

      if (existingContribution) {
        console.log(`Contribution already exists: ${existingContribution._id}`);
      } else {
        // STEP 2: Create contribution - SIMPLIFIED APPROACH
        console.log('Creating new contribution...');

        try {
          // Create contribution directly with MongoDB - using the approach from our script
          const contributionId = uuidv4();
          const contributionData = {
            _id: new mongoose.Types.ObjectId(),
            id: contributionId,
            fundItemId: campaignId,
            userId: userId,
            amount: amount,
            status: 'completed',
            message: message || '',
            anonymous: anonymous === 'true',
            stripeSessionId: session.id,
            createdAt: new Date()
          };

          console.log('Contribution data:', contributionData);

          try {
            // Insert directly into MongoDB collection
            const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);

            console.log('Contribution created with MongoDB ID:', result.insertedId);
            console.log('Contribution created with custom ID:', contributionId);
          } catch (insertError) {
            console.error('Error inserting contribution:', insertError);
            throw insertError; // Re-throw to trigger outer error handler
          }

          // STEP 3: Update campaign stats - SIMPLIFIED APPROACH
          console.log(`Updating campaign ${campaignId} with amount ${amount}`);

          // Find campaign - using direct MongoDB approach from our script
          console.log(`Looking for campaign with ID: ${campaignId}`);

          try {
            // Find the campaign directly in MongoDB
            const campaign = await mongoose.connection.db.collection('funditems').findOne({
              $or: [
                { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
                { id: campaignId }
              ]
            });

            if (!campaign) {
              console.error(`Campaign not found: ${campaignId}`);
            } else {
              console.log(`Found campaign: ${campaign.name}`);

              // Get current stats for logging
              const previousAmount = campaign.currentAmount || 0;
              const previousContributionsCount = campaign.contributionsCount || 0;
              const previousUniqueContributorsCount = campaign.uniqueContributorsCount || 0;

              // Check if this is a new contributor
              const previousContributions = await mongoose.connection.db.collection('contributions').find({
                $or: [
                  { fundItemId: campaignId, userId: userId },
                  { campaignId: campaignId, contributorId: userId }
                ],
                _id: { $ne: contributionData._id }
              }).toArray();

              const isNewContributor = previousContributions.length === 0;
              console.log(`Is new contributor: ${isNewContributor} (found ${previousContributions.length} previous contributions)`);

              // Update campaign directly in MongoDB
              const updateResult = await mongoose.connection.db.collection('funditems').updateOne(
                { _id: campaign._id },
                {
                  $inc: {
                    currentAmount: amount,
                    contributionsCount: 1,
                    uniqueContributorsCount: isNewContributor ? 1 : 0
                  },
                  $set: {
                    status: (previousAmount + amount >= campaign.fundingGoal) ? 'funded' : campaign.status
                  }
                }
              );

              console.log('Campaign update result:', updateResult);

              // Verify the update
              if (updateResult.modifiedCount === 1) {
                const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });

                console.log('Updated campaign stats:');
                console.log(`  - Current amount: ${previousAmount} -> ${updatedCampaign.currentAmount}`);
                console.log(`  - Contributions count: ${previousContributionsCount} -> ${updatedCampaign.contributionsCount}`);
                console.log(`  - Unique contributors: ${previousUniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
                console.log(`  - Status: ${updatedCampaign.status}`);
              } else {
                console.log('WARNING: Campaign update may not have been applied');
              }
            }
          } catch (campaignError) {
            console.error('Error updating campaign:', campaignError);
          }
        } catch (error) {
          console.error('Error creating contribution or updating campaign:', error);
        }
      }

      console.log('Webhook processing completed successfully');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
