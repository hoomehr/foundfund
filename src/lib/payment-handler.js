// This module provides a robust payment handling system for Stripe payments
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles a successful payment by creating a contribution and updating campaign stats
 * @param {Object} params - Payment parameters
 * @param {string} params.sessionId - Stripe session ID
 * @param {string} params.campaignId - Campaign ID
 * @param {string} params.userId - User ID
 * @param {number} params.amount - Payment amount
 * @param {string} params.message - Optional message
 * @param {boolean} params.anonymous - Whether the contribution is anonymous
 * @returns {Promise<Object>} - The created contribution and updated campaign
 */
async function handleSuccessfulPayment({ sessionId, campaignId, userId, amount, message = '', anonymous = false }) {
  console.log('=== PAYMENT HANDLER - PROCESSING PAYMENT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Session ID:', sessionId);
  console.log('Campaign ID:', campaignId);
  console.log('User ID:', userId);
  console.log('Amount:', amount);
  console.log('Message:', message || 'N/A');
  console.log('Anonymous:', anonymous ? 'Yes' : 'No');

  // Validate required parameters
  if (!sessionId || !campaignId || !userId || !amount) {
    throw new Error('Missing required parameters: sessionId, campaignId, userId, amount');
  }

  // Check MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected');
  }

  // 1. Check if contribution already exists
  console.log(`Checking for existing contribution with session ID: ${sessionId}`);
  const existingContribution = await mongoose.connection.db.collection('contributions').findOne({
    stripeSessionId: sessionId
  });

  if (existingContribution) {
    console.log('✅ Contribution already exists:');
    console.log('  ID:', existingContribution._id);
    console.log('  Custom ID:', existingContribution.id);
    console.log('  Amount:', existingContribution.amount);
    console.log('  Created At:', existingContribution.createdAt);
    
    // Find campaign to return with the existing contribution
    const campaign = await mongoose.connection.db.collection('funditems').findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
        { id: campaignId }
      ]
    });
    
    return {
      contribution: existingContribution,
      campaign: campaign,
      created: false
    };
  }

  // 2. Create contribution
  console.log('Creating new contribution...');
  const contributionId = uuidv4();
  console.log('Generated contribution ID:', contributionId);

  const contributionData = {
    _id: new mongoose.Types.ObjectId(),
    id: contributionId,
    fundItemId: campaignId,
    userId: userId,
    amount: amount,
    message: message || '',
    anonymous: anonymous === true || anonymous === 'true',
    status: 'completed',
    stripeSessionId: sessionId,
    createdAt: new Date()
  };

  console.log('Contribution data:', JSON.stringify(contributionData, null, 2));

  // Insert contribution
  let result;
  try {
    result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);
    console.log('✅ Contribution created successfully:');
    console.log('  MongoDB ID:', result.insertedId);
    console.log('  Custom ID:', contributionId);
  } catch (insertError) {
    console.error('❌ Error inserting contribution:', insertError);
    throw insertError;
  }

  // 3. Update campaign
  console.log('\n=== UPDATING CAMPAIGN ===');
  console.log(`Updating campaign ${campaignId} with amount ${amount}`);

  // Find campaign
  let campaign;
  try {
    campaign = await mongoose.connection.db.collection('funditems').findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
        { id: campaignId }
      ]
    });

    if (!campaign) {
      console.error(`❌ Campaign not found: ${campaignId}`);
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    console.log('✅ Found campaign:');
    console.log('  ID:', campaign._id);
    console.log('  Name:', campaign.name);
    console.log('  Current Amount:', campaign.currentAmount);
    console.log('  Funding Goal:', campaign.fundingGoal);
    console.log('  Contributions Count:', campaign.contributionsCount);
    console.log('  Unique Contributors Count:', campaign.uniqueContributorsCount);
  } catch (findCampaignError) {
    console.error('❌ Error finding campaign:', findCampaignError);
    throw findCampaignError;
  }

  // Check if this is a new contributor
  let isNewContributor = false;
  try {
    const previousContributions = await mongoose.connection.db.collection('contributions').find({
      $or: [
        { fundItemId: campaignId, userId: userId },
        { campaignId: campaignId, contributorId: userId }
      ],
      _id: { $ne: contributionData._id }
    }).toArray();

    isNewContributor = previousContributions.length === 0;
    console.log(`Is new contributor: ${isNewContributor} (found ${previousContributions.length} previous contributions)`);
  } catch (contributionsError) {
    console.error('❌ Error checking previous contributions:', contributionsError);
    // Default to false if there's an error
    isNewContributor = false;
  }

  // Update campaign
  let updatedCampaign;
  try {
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

    console.log('✅ Campaign updated successfully:');
    console.log('  Matched Count:', updateResult.matchedCount);
    console.log('  Modified Count:', updateResult.modifiedCount);

    // Verify the update
    if (updateResult.modifiedCount === 1) {
      updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });

      console.log('Updated campaign stats:');
      console.log(`  - Current amount: ${campaign.currentAmount} -> ${updatedCampaign.currentAmount}`);
      console.log(`  - Contributions count: ${campaign.contributionsCount} -> ${updatedCampaign.contributionsCount}`);
      console.log(`  - Unique contributors: ${campaign.uniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
      console.log(`  - Status: ${updatedCampaign.status}`);
    } else {
      console.warn('⚠️ Campaign update may not have been applied');
      updatedCampaign = campaign;
    }
  } catch (updateError) {
    console.error('❌ Error updating campaign:', updateError);
    updatedCampaign = campaign;
  }

  console.log('\n=== PAYMENT PROCESSING COMPLETED SUCCESSFULLY ===');

  return {
    contribution: contributionData,
    campaign: updatedCampaign,
    created: true
  };
}

module.exports = {
  handleSuccessfulPayment
};
