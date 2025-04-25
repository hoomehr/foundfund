import { NextResponse } from 'next/server';
import { connectToDatabase, FundItem } from '@/models';

export async function GET(request: Request) {
  try {
    console.log('GET /api/campaigns - Starting');
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');

    console.log('GET /api/campaigns - Query params:', { creatorId, category, status, featured });

    await connectToDatabase();
    console.log('GET /api/campaigns - Connected to database');

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

    if (featured) {
      query.featured = featured === 'true';
    }

    console.log('GET /api/campaigns - Executing query:', JSON.stringify(query));
    const campaigns = await FundItem.find(query).lean();
    console.log('GET /api/campaigns - Found campaigns:', campaigns ? campaigns.length : 0);

    // Handle case where no campaigns are found
    if (!campaigns || campaigns.length === 0) {
      console.log('GET /api/campaigns - No campaigns found, checking if we need to seed mock data');

      // Check if this is the first time the app is run
      const count = await FundItem.countDocuments();
      if (count === 0) {
        console.log('GET /api/campaigns - Database is empty, seeding with mock data');

        // Import mock data
        try {
          const { fundItems } = await import('@/data/mockData');

          // Insert mock data
          if (fundItems && fundItems.length > 0) {
            console.log(`GET /api/campaigns - Inserting ${fundItems.length} mock campaigns`);
            await FundItem.insertMany(fundItems);
            console.log('GET /api/campaigns - Mock data inserted successfully');

            // Fetch the inserted campaigns
            const seededCampaigns = await FundItem.find(query).lean();
            console.log('GET /api/campaigns - Fetched seeded campaigns:', seededCampaigns.length);

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
          console.error('GET /api/campaigns - Error seeding mock data:', seedError);
          // Continue to return empty array
        }
      }

      // If we're looking for campaigns by creatorId and it's 'user1', return mock data
      if (creatorId === 'user1') {
        console.log('GET /api/campaigns - Using mock data for user1');
        try {
          const { fundItems } = await import('@/data/mockData');
          const userCampaigns = fundItems.filter(item => item.creatorId === 'user1');
          console.log(`GET /api/campaigns - Found ${userCampaigns.length} mock campaigns for user1`);
          return NextResponse.json(userCampaigns);
        } catch (mockError) {
          console.error('GET /api/campaigns - Error loading mock data:', mockError);
        }
      }

      console.log('GET /api/campaigns - Returning empty array');
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
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('POST /api/campaigns - Starting');

  try {
    // Log request details
    console.log('POST /api/campaigns - Request method:', request.method);
    console.log('POST /api/campaigns - Request headers:', Object.fromEntries(request.headers.entries()));

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('POST /api/campaigns - Request body parsed successfully');
      console.log('POST /api/campaigns - Request body:', body);
    } catch (parseError) {
      console.error('POST /api/campaigns - Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    await connectToDatabase();
    console.log('POST /api/campaigns - Connected to database');

    // Validate required fields
    const requiredFields = ['name', 'description', 'category', 'fundingGoal', 'imageUrl', 'endDate'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.log(`POST /api/campaigns - Missing required fields: ${missingFields.join(', ')}`);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create new campaign
    console.log('POST /api/campaigns - Creating new campaign with data:', JSON.stringify(body));
    let campaign;

    try {
      campaign = new FundItem(body);
      console.log('POST /api/campaigns - Campaign model created, saving to database...');
      await campaign.save();
      console.log('POST /api/campaigns - Campaign saved successfully with ID:', campaign._id);

      // Verify the campaign was saved by fetching it back
      const savedCampaign = await FundItem.findById(campaign._id);
      console.log('POST /api/campaigns - Verified campaign in database:', savedCampaign ? 'Found' : 'Not found');
      if (savedCampaign) {
        console.log('POST /api/campaigns - Campaign name:', savedCampaign.name);
      }
    } catch (error: any) {
      console.error('POST /api/campaigns - Error saving campaign:', error);
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
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
