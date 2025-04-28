import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, Contribution, FundItem } from '@/models';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || searchParams.get('fundItemId');
    const userId = searchParams.get('userId');
    const contributorId = searchParams.get('contributorId');
    const stripeSessionId = searchParams.get('stripeSessionId');

    await connectToDatabase();

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
      query.stripeSessionId = stripeSessionId;
    }

    const contributions = await Contribution.find(query).lean();

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
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check for required fields
    if (!body.userId || !body.campaignId || !body.amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if campaign exists
    const campaignId = body.campaignId;

    // Try to find the campaign in the database by id field
    let campaign = await FundItem.findOne({ id: campaignId });

    // If not found by id field, try to find by MongoDB _id
    if (!campaign && /^[0-9a-fA-F]{24}$/.test(campaignId)) {
      try {
        campaign = await FundItem.findById(campaignId);
      } catch (error) {
        // Continue to next check
      }
    }

    // If still not found, check if it's a mock data ID (like 'fund1', 'fund2', etc.)
    if (!campaign && campaignId && (campaignId.startsWith('fund') || campaignId.startsWith('campaign-'))) {
      try {
        // Import mock data
        const { fundItems } = await import('@/data/mockData');

        // Find the campaign in mock data
        const mockCampaign = fundItems.find(item => item.id === campaignId);

        if (mockCampaign) {
          // Create the campaign in the database from mock data
          campaign = new FundItem(mockCampaign);
          await campaign.save();
        }
      } catch (error) {
        // Continue with null campaign
      }
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if a contribution with this Stripe session ID already exists
    if (body.stripeSessionId) {
      const existingContribution = await Contribution.findOne({ stripeSessionId: body.stripeSessionId });
      if (existingContribution) {
        // Return the existing contribution
        const formattedContribution = {
          id: existingContribution.id || existingContribution._id.toString(),
          ...existingContribution.toObject(),
          _id: undefined
        };

        return NextResponse.json(formattedContribution);
      }
    }

    // Generate a unique ID if not provided
    if (!body.id) {
      body.id = uuidv4();
    }

    // Ensure required fields are present
    if (!body.fundItemId && body.campaignId) {
      body.fundItemId = body.campaignId;
    }

    if (!body.userId && body.contributorId) {
      body.userId = body.contributorId;
    }

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
    try {
      if (mongoose.connection && mongoose.connection.db) {
        result = await mongoose.connection.db.collection('contributions').insertOne(contributionDoc);
      } else {
        // Fallback to using the model
        const contribution = new Contribution(contributionDoc);
        await contribution.save();
        result = {
          acknowledged: true,
          insertedId: contribution._id
        };
      }

      if (result.acknowledged) {
        // Set the body ID to the MongoDB ID for later use
        body._id = result.insertedId;
      } else {
        // Fallback to traditional approach
        const contribution = new Contribution(body);
        await contribution.save();
      }
    } catch (error) {
      return NextResponse.json({ error: 'Failed to save contribution' }, { status: 500 });
    }

    // Update the campaign's current amount
    if (body.campaignId || body.fundItemId) {
      const campaignId = body.campaignId || body.fundItemId;

      try {
        // First try to find by custom id field (safer approach)
        let campaign = await FundItem.findOne({ id: campaignId });

        if (!campaign) {
          // Try to find by MongoDB _id if it looks like a valid ObjectId
          if (/^[0-9a-fA-F]{24}$/.test(campaignId)) {
            try {
              campaign = await FundItem.findById(campaignId);
            } catch (error) {
              // Continue to next check
            }
          }

          // If still not found, check if it's a mock data ID
          if (!campaign && campaignId && (campaignId.startsWith('fund') || campaignId.startsWith('campaign-'))) {
            // Import mock data
            const { fundItems } = await import('@/data/mockData');

            // Find the campaign in mock data
            const mockCampaign = fundItems.find(item => item.id === campaignId);

            if (mockCampaign) {
              // Create the campaign in the database from mock data
              campaign = new FundItem(mockCampaign);
              await campaign.save();
            }
          }
        }

        if (campaign) {
          // Update the campaign's current amount
          const previousAmount = campaign.currentAmount || 0;
          campaign.currentAmount = previousAmount + body.amount;

          // Increment the contributions count
          const previousContributionsCount = campaign.contributionsCount || 0;
          campaign.contributionsCount = previousContributionsCount + 1;

          // Update unique contributors count
          // First, get all previous contributions for this campaign from this user
          const contributorId = body.contributorId || body.userId;

          const existingContributions = await Contribution.find({
            $or: [
              { campaignId: campaignId, contributorId: contributorId, _id: { $ne: body.id } },
              { fundItemId: campaignId, userId: contributorId, _id: { $ne: body.id } }
            ]
          });

          // If this is the first contribution from this user, increment the unique contributors count
          if (existingContributions.length === 0) {
            const previousUnique = campaign.uniqueContributorsCount || 0;
            campaign.uniqueContributorsCount = previousUnique + 1;
          }

          // If the campaign has reached or exceeded its funding goal, update its status
          if (campaign.currentAmount >= campaign.fundingGoal && campaign.status !== 'funded') {
            campaign.status = 'funded';
          }

          // Save the campaign
          try {
            await campaign.save();
          } catch (error) {
            // Continue even if campaign update fails
          }
        }
      } catch (error) {
        // We don't want to fail the contribution if updating the campaign fails
        // Just continue
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

      return NextResponse.json(formattedContribution, { status: 201 });
    } else {
      // Fallback to the contribution object we created
      const formattedContribution = {
        id: body.id,
        ...body,
        _id: undefined
      };

      return NextResponse.json(formattedContribution, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
  }
}
