// This script directly adds a contribution to the database for a specific Stripe session
// Run with: node src/scripts/add-stripe-contribution.js <session_id> <campaign_id> <user_id> <amount>

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Get command line arguments
const args = process.argv.slice(2);
const sessionId = args[0];
const campaignId = args[1];
const userId = args[2];
const amount = parseFloat(args[3]);

if (!sessionId || !campaignId || !userId || isNaN(amount)) {
  console.error('Usage: node src/scripts/add-stripe-contribution.js <session_id> <campaign_id> <user_id> <amount>');
  process.exit(1);
}

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

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

// Add a contribution directly to the database
async function addContribution() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB');
    return;
  }

  try {
    console.log(`Adding contribution for session ${sessionId}, campaign ${campaignId}, user ${userId}, amount ${amount}`);

    // Check if contribution already exists
    const existingContribution = await mongoose.connection.db.collection('contributions').findOne({ 
      stripeSessionId: sessionId 
    });
    
    if (existingContribution) {
      console.log(`Contribution already exists for session ${sessionId}`);
      return;
    }

    // Create contribution document
    const contributionId = uuidv4();
    const contributionData = {
      _id: new mongoose.Types.ObjectId(),
      id: contributionId,
      fundItemId: campaignId,
      userId: userId,
      amount: amount,
      message: 'Added via Stripe session script',
      anonymous: false,
      status: 'completed',
      stripeSessionId: sessionId,
      createdAt: new Date()
    };

    console.log('Contribution data:', contributionData);

    // Insert directly into MongoDB collection
    const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);
    
    console.log('Contribution added with ID:', result.insertedId);
    console.log('Contribution added with custom ID:', contributionId);

    // Update campaign stats
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
      return;
    }

    console.log(`Found campaign: ${campaign.name}`);

    // Update campaign stats
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
          status: (previousAmount + amount >= campaign.fundingGoal) ? 'funded' : campaign.status
        }
      }
    );

    console.log('Campaign update result:', updateResult);
    
    // Verify the update
    const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });
    
    console.log('Updated campaign stats:');
    console.log(`  - Current amount: ${previousAmount} -> ${updatedCampaign.currentAmount}`);
    console.log(`  - Contributions count: ${previousContributionsCount} -> ${updatedCampaign.contributionsCount}`);
    console.log(`  - Unique contributors: ${previousUniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
addContribution();
