import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, Contribution, FundItem } from '@/models';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    console.log('GET /api/contributions - Starting');

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || searchParams.get('fundItemId');
    const userId = searchParams.get('userId');
    const contributorId = searchParams.get('contributorId');
    const stripeSessionId = searchParams.get('stripeSessionId');

    console.log('GET /api/contributions - Query params:', { campaignId, userId, contributorId, stripeSessionId });

    await connectToDatabase();
    console.log('GET /api/contributions - Connected to database');

    // Build query based on parameters
    const query: any = {};

    if (campaignId) {
      // Support both old and new field names
      query.$or = [{ fundItemId: campaignId }, { campaignId }];
    }

    if (userId) {
      query.userId = userId;
    }

    if (contributorId) {
      query.contributorId = contributorId;
    }

    if (stripeSessionId) {
      console.log(`GET /api/contributions - Searching for contribution with stripeSessionId: ${stripeSessionId}`);
      query.stripeSessionId = stripeSessionId;
    }

    console.log('GET /api/contributions - Executing query:', JSON.stringify(query));
    const contributions = await Contribution.find(query).lean();
    console.log('GET /api/contributions - Found contributions:', contributions ? contributions.length : 0);

    // Handle case where no contributions are found
    if (!contributions || contributions.length === 0) {
      return NextResponse.json([]);
    }

    // Convert _id to id for frontend compatibility
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id || (contribution._id ? contribution._id.toString() : ''),
      ...contribution,
      _id: undefined
    }));

    return NextResponse.json(formattedContributions);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/contributions - Starting');

    const body = await request.json();
    console.log('POST /api/contributions - Request body:', body);

    // Check for required fields
    if (!body.userId || !body.campaignId || !body.amount) {
      console.log('POST /api/contributions - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    console.log('POST /api/contributions - Connected to database');

    // Check if campaign exists
    const campaignId = body.campaignId;

    // Try to find the campaign in the database by id field
    let campaign = await FundItem.findOne({ id: campaignId });

    // If not found by id field, try to find by MongoDB _id
    if (!campaign && /^[0-9a-fA-F]{24}$/.test(campaignId)) {
      try {
        console.log(`POST /api/contributions - Not found by id field, trying MongoDB _id`);
        campaign = await FundItem.findById(campaignId);
      } catch (error) {
        console.error(`POST /api/contributions - Error finding by _id:`, error);
      }
    }

    // If still not found, check if it's a mock data ID (like 'fund1', 'fund2', etc.)
    if (!campaign && campaignId && (campaignId.startsWith('fund') || campaignId.startsWith('campaign-'))) {
      console.log(`POST /api/contributions - Campaign ${campaignId} not found in database, but appears to be a mock ID`);

      try {
        // Import mock data
        const { fundItems } = await import('@/data/mockData');

        // Find the campaign in mock data
        const mockCampaign = fundItems.find(item => item.id === campaignId);

        if (mockCampaign) {
          console.log(`POST /api/contributions - Found campaign ${campaignId} in mock data`);

          // Create the campaign in the database from mock data
          campaign = new FundItem(mockCampaign);
          await campaign.save();
          console.log(`POST /api/contributions - Saved mock campaign ${campaignId} to database`);
        }
      } catch (error) {
        console.error(`POST /api/contributions - Error handling mock data:`, error);
      }
    }

    if (!campaign) {
      console.log(`POST /api/contributions - Campaign ${campaignId} not found`);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if a contribution with this Stripe session ID already exists
    if (body.stripeSessionId) {
      console.log(`POST /api/contributions - Checking for existing contribution with session ID: ${body.stripeSessionId}`);
      const existingContribution = await Contribution.findOne({ stripeSessionId: body.stripeSessionId });
      if (existingContribution) {
        console.log(`POST /api/contributions - Contribution already exists for session ${body.stripeSessionId} with ID: ${existingContribution.id || existingContribution._id}`);

        // Return the existing contribution
        const formattedContribution = {
          id: existingContribution.id || existingContribution._id.toString(),
          ...existingContribution.toObject(),
          _id: undefined
        };

        return NextResponse.json(formattedContribution);
      } else {
        console.log(`POST /api/contributions - No existing contribution found for session ${body.stripeSessionId}`);
      }
    }

    // Generate a unique ID if not provided
    if (!body.id) {
      body.id = uuidv4();
      console.log(`POST /api/contributions - Generated new ID: ${body.id}`);
    } else {
      console.log(`POST /api/contributions - Using provided ID: ${body.id}`);
    }

    // Ensure required fields are present
    if (!body.fundItemId && body.campaignId) {
      body.fundItemId = body.campaignId;
      console.log(`POST /api/contributions - Set fundItemId to campaignId: ${body.campaignId}`);
    }

    if (!body.userId && body.contributorId) {
      body.userId = body.contributorId;
      console.log(`POST /api/contributions - Set userId to contributorId: ${body.contributorId}`);
    }

    console.log(`POST /api/contributions - Creating contribution with data:`, {
      id: body.id,
      campaignId: body.campaignId,
      fundItemId: body.fundItemId,
      amount: body.amount,
      stripeSessionId: body.stripeSessionId
    });

    // Create new contribution - SIMPLIFIED DIRECT APPROACH
    try {
      console.log(`POST /api/contributions - Using direct MongoDB insertion`);

      // Create a MongoDB document directly
      const contributionDoc = {
        _id: new mongoose.Types.ObjectId(),
        id: body.id,
        fundItemId: body.fundItemId || body.campaignId,
        userId: body.userId || body.contributorId,
        amount: body.amount,
        message: body.message || '',
        anonymous: body.anonymous || false,
        status: body.status || 'completed',
        stripeSessionId: body.stripeSessionId,
        createdAt: new Date()
      };

      // Insert directly into MongoDB collection
      let result;
      if (mongoose.connection && mongoose.connection.db) {
        result = await mongoose.connection.db.collection('contributions').insertOne(contributionDoc);
      } else {
        // Fallback to using the model
        console.log(`POST /api/contributions - MongoDB connection not ready, using Mongoose model instead`);
        const contribution = new Contribution(contributionDoc);
        await contribution.save();
        result = {
          acknowledged: true,
          insertedId: contribution._id
        };
      }
      console.log(`POST /api/contributions - Direct insertion result:`, {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId
      });

      if (result.acknowledged) {
        console.log(`POST /api/contributions - Successfully inserted contribution with MongoDB ID: ${result.insertedId}`);

        // Set the body ID to the MongoDB ID for later use
        body._id = result.insertedId;
      } else {
        console.log(`POST /api/contributions - WARNING: MongoDB insertion may not have succeeded`);

        // Fallback to traditional approach
        try {
          console.log(`POST /api/contributions - Trying traditional Mongoose approach as fallback`);
          const contribution = new Contribution(body);
          await contribution.save();
          console.log(`POST /api/contributions - Fallback successful, created with ID: ${contribution.id || contribution._id}`);
        } catch (fallbackError) {
          console.error(`POST /api/contributions - Fallback also failed:`, fallbackError);
          return NextResponse.json({ error: 'Failed to save contribution' }, { status: 500 });
        }
      }
    } catch (error) {
      console.error(`POST /api/contributions - Error saving contribution:`, error);
      return NextResponse.json({ error: 'Failed to save contribution' }, { status: 500 });
    }

    // Update the campaign's current amount
    if (body.campaignId || body.fundItemId) {
      const campaignId = body.campaignId || body.fundItemId;
      console.log(`POST /api/contributions - Looking for campaign with ID: ${campaignId}`);

      try {
        // First try to find by custom id field (safer approach)
        let campaign = await FundItem.findOne({ id: campaignId });

        if (campaign) {
          console.log(`POST /api/contributions - Found campaign by id field: ${campaignId}`);
        } else {
          // Try to find by MongoDB _id if it looks like a valid ObjectId
          if (/^[0-9a-fA-F]{24}$/.test(campaignId)) {
            try {
              console.log(`POST /api/contributions - Not found by id field, trying MongoDB _id`);
              campaign = await FundItem.findById(campaignId);
              if (campaign) {
                console.log(`POST /api/contributions - Found campaign by MongoDB _id: ${campaignId}`);
              }
            } catch (error) {
              console.error(`POST /api/contributions - Error finding by _id:`, error);
            }
          }

          // If still not found, check if it's a mock data ID
          if (!campaign && campaignId && (campaignId.startsWith('fund') || campaignId.startsWith('campaign-'))) {
            console.log(`POST /api/contributions - Campaign ${campaignId} not found in database, but appears to be a mock ID`);

            // Import mock data
            const { fundItems } = await import('@/data/mockData');

            // Find the campaign in mock data
            const mockCampaign = fundItems.find(item => item.id === campaignId);

            if (mockCampaign) {
              console.log(`POST /api/contributions - Found campaign ${campaignId} in mock data`);

              // Create the campaign in the database from mock data
              campaign = new FundItem(mockCampaign);
              await campaign.save();
              console.log(`POST /api/contributions - Saved mock campaign ${campaignId} to database`);
            }
          } else if (!campaign) {
            console.log(`POST /api/contributions - Not a valid ObjectId or mock ID, skipping search`);
          }
        }

        if (campaign) {
          console.log(`POST /api/contributions - Updating campaign ${campaignId} with contribution amount: ${body.amount}`);

          // Update the campaign's current amount
          const previousAmount = campaign.currentAmount || 0;
          campaign.currentAmount = previousAmount + body.amount;

          // Increment the contributions count
          const previousContributionsCount = campaign.contributionsCount || 0;
          campaign.contributionsCount = previousContributionsCount + 1;

          // Update unique contributors count
          // First, get all previous contributions for this campaign from this user
          const contributorId = body.contributorId || body.userId;
          console.log(`POST /api/contributions - Checking for previous contributions from user: ${contributorId}`);

          const existingContributions = await Contribution.find({
            $or: [
              { campaignId: campaignId, contributorId: contributorId, _id: { $ne: body.id } },
              { fundItemId: campaignId, userId: contributorId, _id: { $ne: body.id } }
            ]
          });

          console.log(`POST /api/contributions - Found ${existingContributions.length} previous contributions from this user`);

          // If this is the first contribution from this user, increment the unique contributors count
          if (existingContributions.length === 0) {
            const previousUnique = campaign.uniqueContributorsCount || 0;
            campaign.uniqueContributorsCount = previousUnique + 1;
            console.log(`POST /api/contributions - New unique contributor: ${contributorId}`);
            console.log(`POST /api/contributions - Updated unique contributors count from ${previousUnique} to ${campaign.uniqueContributorsCount}`);
          }

          // If the campaign has reached or exceeded its funding goal, update its status
          if (campaign.currentAmount >= campaign.fundingGoal && campaign.status !== 'funded') {
            campaign.status = 'funded';
            console.log(`POST /api/contributions - Campaign ${campaignId} has been fully funded!`);
          }

          // Save the campaign
          try {
            await campaign.save();
            console.log(`POST /api/contributions - Successfully updated campaign ${campaignId}:`);
            console.log(`  - Current amount: ${previousAmount} -> ${campaign.currentAmount}`);
            console.log(`  - Contributions count: ${previousContributionsCount} -> ${campaign.contributionsCount}`);
            console.log(`  - Unique contributors: ${campaign.uniqueContributorsCount}`);

            // Verify the campaign was updated
            const updatedCampaign = await FundItem.findOne({ id: campaignId });
            if (updatedCampaign) {
              console.log(`POST /api/contributions - Verified campaign update:`);
              console.log(`  - Current amount: ${updatedCampaign.currentAmount}`);
              console.log(`  - Contributions count: ${updatedCampaign.contributionsCount}`);
              console.log(`  - Unique contributors: ${updatedCampaign.uniqueContributorsCount}`);
            } else {
              console.log(`POST /api/contributions - WARNING: Could not verify campaign update`);
            }
          } catch (error) {
            console.error(`POST /api/contributions - Error saving campaign:`, error);
          }
        } else {
          console.log(`POST /api/contributions - Campaign ${campaignId} not found for update`);
        }
      } catch (error) {
        console.error(`POST /api/contributions - Error updating campaign:`, error);
        // We don't want to fail the contribution if updating the campaign fails
        // Just log the error and continue
      }
    }

    // Find the contribution we just created to ensure it's returned correctly
    const savedContribution = await Contribution.findOne({ id: body.id });

    if (savedContribution) {
      // Convert _id to id for frontend compatibility
      const formattedContribution = {
        id: savedContribution.id || savedContribution._id.toString(),
        ...savedContribution.toObject(),
        _id: undefined
      };

      console.log(`POST /api/contributions - Returning contribution with ID: ${formattedContribution.id}`);
      return NextResponse.json(formattedContribution, { status: 201 });
    } else {
      // Fallback to the contribution object we created
      console.log(`POST /api/contributions - Could not find saved contribution, returning original object`);
      const formattedContribution = {
        id: body.id,
        ...body,
        _id: undefined
      };

      return NextResponse.json(formattedContribution, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
  }
}
