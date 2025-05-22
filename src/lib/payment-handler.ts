// This module provides a robust payment handling system for Stripe payments
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Campaign, Contribution } from '@/types';

interface PaymentParams {
  sessionId: string;
  campaignId: string;
  userId: string;
  amount: number;
  message?: string;
  anonymous?: boolean;
}

interface PaymentResult {
  contribution: Contribution;
  campaign: Campaign;
  created: boolean;
}

/**
 * Helper function to get a human-readable description of the MongoDB connection state
 */
function getConnectionStateDescription(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    case 99: return 'uninitialized';
    default: return 'unknown';
  }
}

/**
 * Handles a successful payment by creating a contribution and updating campaign stats
 */
export async function handleSuccessfulPayment({
  sessionId,
  campaignId,
  userId,
  amount,
  message = '',
  anonymous = false
}: PaymentParams): Promise<PaymentResult> {
  // Validate required parameters
  if (!sessionId || !campaignId || !userId || !amount) {
    throw new Error('Missing required parameters: sessionId, campaignId, userId, amount');
  }

  // Check MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    try {
      // Import connectToDatabase dynamically to avoid circular dependencies
      const { connectToDatabase } = await import('@/models');
      await connectToDatabase();

      if (mongoose.connection.readyState === 1) {
        // Connection successful
      } else {
        throw new Error(`Failed to connect to MongoDB. Connection state: ${mongoose.connection.readyState}`);
      }
    } catch (error) {
      throw new Error('Failed to connect to MongoDB');
    }
  }

  // 1. Check if contribution already exists
  if (!mongoose.connection.db) {
    throw new Error('MongoDB database connection not established');
  }

  let existingContribution;
  try {
    existingContribution = await mongoose.connection.db.collection('contributions').findOne({
      stripeSessionId: sessionId
    });
  } catch (queryError) {
    throw new Error(`Failed to query for existing contribution: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
  }

  if (existingContribution) {

    // Find campaign to return with the existing contribution
    const campaign = await mongoose.connection.db.collection('funditems').findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : undefined },
        { id: campaignId }
      ]
    });

    return {
      contribution: existingContribution as unknown as Contribution,
      campaign: (campaign || {}) as unknown as Campaign,
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
    anonymous: typeof anonymous === 'string' ? anonymous === 'true' : Boolean(anonymous),
    status: 'completed',
    stripeSessionId: sessionId,
    createdAt: new Date()
  };

  console.log('Contribution data:', JSON.stringify(contributionData, null, 2));

  // Insert contribution
  let result;
  try {
    // Ensure db is defined
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database connection not established');
    }

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
    // Ensure db is defined
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database connection not established');
    }

    campaign = await mongoose.connection.db.collection('funditems').findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : undefined },
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
    // Ensure db is defined
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database connection not established');
    }

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
  let updatedCampaign = campaign; // Default to original campaign
  try {
    // Ensure db is defined
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database connection not established');
    }

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
      const fetchedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });

      if (fetchedCampaign) {
        updatedCampaign = fetchedCampaign;
        console.log('Updated campaign stats:');
        console.log(`  - Current amount: ${campaign.currentAmount} -> ${updatedCampaign.currentAmount}`);
        console.log(`  - Contributions count: ${campaign.contributionsCount} -> ${updatedCampaign.contributionsCount}`);
        console.log(`  - Unique contributors: ${campaign.uniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
        console.log(`  - Status: ${updatedCampaign.status}`);
      } else {
        console.warn('⚠️ Could not fetch updated campaign');
      }
    } else {
      console.warn('⚠️ Campaign update may not have been applied');
    }
  } catch (updateError) {
    console.error('❌ Error updating campaign:', updateError);
  }

  console.log('\n=== PAYMENT PROCESSING COMPLETED SUCCESSFULLY ===');

  return {
    contribution: contributionData as unknown as Contribution,
    campaign: updatedCampaign as unknown as Campaign,
    created: true
  };
}
