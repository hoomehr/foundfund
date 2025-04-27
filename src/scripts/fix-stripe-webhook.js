// This script fixes the Stripe webhook issue by directly adding contributions for all Stripe sessions
// Run with: node src/scripts/fix-stripe-webhook.js

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Stripe = require('stripe');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
}

// Fix Stripe webhook issue
async function fixStripeWebhook() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB');
    return;
  }

  try {
    console.log('Retrieving recent Stripe checkout sessions...');
    
    // Get recent checkout sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items']
    });
    
    console.log(`Found ${sessions.data.length} checkout sessions`);
    
    // Process each session
    for (const session of sessions.data) {
      console.log(`\nProcessing session ${session.id}`);
      console.log(`Status: ${session.status}`);
      console.log(`Payment status: ${session.payment_status}`);
      
      // Only process completed sessions
      if (session.status === 'complete' && session.payment_status === 'paid') {
        console.log('Session is complete and paid');
        
        // Extract metadata
        const metadata = session.metadata || {};
        console.log('Session metadata:', metadata);
        
        const campaignId = metadata.campaignId;
        const userId = metadata.userId;
        const message = metadata.message;
        const anonymous = metadata.anonymous;
        
        // Extract amount
        const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents to dollars
        console.log(`Amount: ${amount}`);
        
        // Check if we have the required metadata
        if (!campaignId || !userId) {
          console.log('Missing required metadata, skipping session');
          continue;
        }
        
        // Check if contribution already exists
        console.log(`Checking for existing contribution with session ID: ${session.id}`);
        const existingContribution = await mongoose.connection.db.collection('contributions').findOne({ 
          stripeSessionId: session.id 
        });
        
        if (existingContribution) {
          console.log(`Contribution already exists: ${existingContribution._id}`);
          continue;
        }
        
        // Create contribution
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
        
        // Update campaign
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
          continue;
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
        
        // Verify the update
        const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });
        
        console.log('Updated campaign stats:');
        console.log(`  - Current amount: ${campaign.currentAmount} -> ${updatedCampaign.currentAmount}`);
        console.log(`  - Contributions count: ${campaign.contributionsCount} -> ${updatedCampaign.contributionsCount}`);
        console.log(`  - Unique contributors: ${campaign.uniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
      } else {
        console.log('Session is not complete or not paid, skipping');
      }
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
fixStripeWebhook();
