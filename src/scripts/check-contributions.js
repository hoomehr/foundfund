// This script checks the current contributions for a campaign
// Run with: node src/scripts/check-contributions.js

require('dotenv').config();
const mongoose = require('mongoose');

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

// Check contributions for a campaign
async function checkContributions() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB');
    return;
  }

  try {
    // Campaign ID
    const campaignId = '680adc2a49d548cc43032cad'; // Replace with your campaign ID

    console.log(`Checking contributions for campaign ${campaignId}`);

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
    console.log(`Current amount: ${campaign.currentAmount}`);
    console.log(`Contributions count: ${campaign.contributionsCount}`);
    console.log(`Unique contributors count: ${campaign.uniqueContributorsCount}`);

    // Find contributions
    const contributions = await mongoose.connection.db.collection('contributions').find({
      $or: [
        { fundItemId: campaignId },
        { campaignId: campaignId }
      ]
    }).toArray();

    console.log(`Found ${contributions.length} contributions:`);
    
    // Calculate total amount
    let totalAmount = 0;
    
    // Print contributions
    contributions.forEach((contribution, index) => {
      console.log(`\nContribution ${index + 1}:`);
      console.log(`  ID: ${contribution.id || contribution._id}`);
      console.log(`  User ID: ${contribution.userId || contribution.contributorId}`);
      console.log(`  Amount: ${contribution.amount}`);
      console.log(`  Status: ${contribution.status}`);
      console.log(`  Created At: ${contribution.createdAt}`);
      console.log(`  Stripe Session ID: ${contribution.stripeSessionId || 'N/A'}`);
      
      totalAmount += contribution.amount;
    });
    
    console.log(`\nTotal amount from contributions: ${totalAmount}`);
    console.log(`Campaign current amount: ${campaign.currentAmount}`);
    
    if (totalAmount !== campaign.currentAmount) {
      console.log(`WARNING: Total amount from contributions (${totalAmount}) does not match campaign current amount (${campaign.currentAmount})`);
    } else {
      console.log('Total amount from contributions matches campaign current amount');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
checkContributions();
