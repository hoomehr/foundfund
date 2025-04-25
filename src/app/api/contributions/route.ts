import { NextResponse } from 'next/server';
import { connectToDatabase, Contribution, FundItem } from '@/models';

export async function GET(request: Request) {
  try {
    console.log('GET /api/contributions - Starting');

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || searchParams.get('fundItemId');
    const userId = searchParams.get('userId');
    const contributorId = searchParams.get('contributorId');

    console.log('GET /api/contributions - Query params:', { campaignId, userId, contributorId });

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

    console.log('GET /api/contributions - Executing query:', JSON.stringify(query));
    const contributions = await Contribution.find(query).lean();
    console.log('GET /api/contributions - Found contributions:', contributions ? contributions.length : 0);

    // Handle case where no contributions are found
    if (!contributions || contributions.length === 0) {
      return NextResponse.json([]);
    }

    // Convert _id to id for frontend compatibility
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id || contribution._id.toString(),
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

    // Create new contribution
    const contribution = new Contribution(body);
    await contribution.save();
    console.log('POST /api/contributions - Contribution created with ID:', contribution._id);

    // Update the campaign's current amount
    if (body.campaignId || body.fundItemId) {
      const campaignId = body.campaignId || body.fundItemId;
      console.log(`POST /api/contributions - Looking for campaign with ID: ${campaignId}`);

      try {
        // First try to find by custom id field (safer approach)
        let campaign = await FundItem.findOne({ id: campaignId });

        if (!campaign) {
          // Try to find by MongoDB _id if it looks like a valid ObjectId
          if (/^[0-9a-fA-F]{24}$/.test(campaignId)) {
            try {
              console.log(`POST /api/contributions - Not found by id field, trying MongoDB _id`);
              campaign = await FundItem.findById(campaignId);
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
          campaign.currentAmount = (campaign.currentAmount || 0) + body.amount;
          await campaign.save();
          console.log(`POST /api/contributions - Updated campaign ${campaignId} amount to ${campaign.currentAmount}`);
        } else {
          console.log(`POST /api/contributions - Campaign ${campaignId} not found for update`);
        }
      } catch (error) {
        console.error(`POST /api/contributions - Error updating campaign:`, error);
        // We don't want to fail the contribution if updating the campaign fails
        // Just log the error and continue
      }
    }

    // Convert _id to id for frontend compatibility
    const formattedContribution = {
      id: contribution._id.toString(),
      ...contribution.toObject(),
      _id: undefined
    };

    return NextResponse.json(formattedContribution, { status: 201 });
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
  }
}
