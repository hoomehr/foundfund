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
      return NextResponse.json([]);
    }

    // Convert _id to id for frontend compatibility
    const formattedCampaigns = campaigns.map(campaign => {
      // If the campaign already has an id field, use it
      const id = campaign.id || campaign._id.toString();
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
