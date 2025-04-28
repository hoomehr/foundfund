import { NextResponse } from 'next/server';
import { connectToDatabase, FundItem } from '@/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');

    await connectToDatabase();

    // Build query based on parameters
    const query: any = {};

    if (creatorId) {
      query.creatorId = creatorId;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (featured !== null && featured !== undefined) {
      query.featured = featured === 'true';
    }

    const campaigns = await FundItem.find(query).lean();

    // Handle case where no campaigns are found
    if (!campaigns || campaigns.length === 0) {
      // Check if this is the first time the app is run
      const count = await FundItem.countDocuments();
      if (count === 0) {
        // Import mock data
        try {
          const { fundItems } = await import('@/data/mockData');

          // Insert mock data
          if (fundItems && fundItems.length > 0) {
            await FundItem.insertMany(fundItems);

            // Fetch the inserted campaigns
            const seededCampaigns = await FundItem.find(query).lean();

            // Format and return the seeded campaigns
            const formattedSeededCampaigns = seededCampaigns.map(campaign => {
              const id = campaign.id || (campaign._id ? campaign._id.toString() : undefined);
              return {
                id,
                ...campaign,
                _id: undefined
              };
            });

            return NextResponse.json(formattedSeededCampaigns);
          }
        } catch (seedError) {
          // Continue to return empty array
        }
      }

      // If we're looking for campaigns by creatorId and it's 'user1', return mock data
      if (creatorId === 'user1') {
        try {
          const { fundItems } = await import('@/data/mockData');
          const userCampaigns = fundItems.filter(item => item.creatorId === 'user1');
          return NextResponse.json(userCampaigns);
        } catch (mockError) {
          // Continue to return empty array
        }
      }

      return NextResponse.json([]);
    }

    // Convert _id to id for frontend compatibility
    const formattedCampaigns = campaigns.map(campaign => {
      // If the campaign already has an id field, use it
      const id = campaign.id || (campaign._id ? campaign._id.toString() : undefined);
      return {
        id,
        ...campaign,
        _id: undefined
      };
    });

    return NextResponse.json(formattedCampaigns);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    await connectToDatabase();

    // Validate required fields
    const requiredFields = ['name', 'description', 'category', 'fundingGoal', 'imageUrl', 'endDate'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create new campaign
    let campaign;

    try {
      campaign = new FundItem(body);
      await campaign.save();
    } catch (error: any) {
      return NextResponse.json({
        error: `Failed to save campaign: ${error.message || 'Unknown error'}`
      }, { status: 500 });
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    // Convert _id to id for frontend compatibility
    const formattedCampaign = {
      id: campaign.id || campaign._id.toString(),
      ...campaign.toObject(),
      _id: undefined
    };

    return NextResponse.json(formattedCampaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
