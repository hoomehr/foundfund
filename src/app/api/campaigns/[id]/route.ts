import { NextResponse } from 'next/server';
import { connectToDatabase, FundItem } from '@/models';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();

    // Try to find by MongoDB _id first, then by our custom id field
    let campaign = await FundItem.findById(id).lean();

    // If not found by _id, try to find by id field
    if (!campaign) {
      campaign = await FundItem.findOne({ id }).lean();
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Convert _id to id for frontend compatibility
    const formattedCampaign = {
      id: campaign.id || campaign._id.toString(),
      ...campaign,
      _id: undefined
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error(`Error fetching campaign ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}
