import { NextResponse } from 'next/server';
import { connectToDatabase, FundItem } from '@/models';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`GET /api/campaigns/${id} - Starting`);

    await connectToDatabase();
    console.log(`GET /api/campaigns/${id} - Connected to database`);

    // Try to find by MongoDB _id first, then by our custom id field
    console.log(`GET /api/campaigns/${id} - Trying to find by MongoDB _id`);
    let campaign;

    try {
      campaign = await FundItem.findById(id).lean();
    } catch (error) {
      console.log(`GET /api/campaigns/${id} - Error finding by _id:`, error.message);
      // Continue to the next method
    }

    // If not found by _id, try to find by id field
    if (!campaign) {
      console.log(`GET /api/campaigns/${id} - Not found by _id, trying to find by id field`);
      campaign = await FundItem.findOne({ id }).lean();
    }

    if (!campaign) {
      console.log(`GET /api/campaigns/${id} - Campaign not found`);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log(`GET /api/campaigns/${id} - Campaign found:`, campaign.name);

    // Convert _id to id for frontend compatibility
    const formattedCampaign = {
      id: campaign.id || campaign._id?.toString(),
      ...campaign,
      _id: undefined
    };

    console.log(`GET /api/campaigns/${id} - Returning formatted campaign`);
    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error(`Error fetching campaign ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}
