import { NextResponse } from 'next/server';
import { connectToDatabase, FundItem } from '@/models';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Use React.use() to properly handle dynamic params
    const params = context.params;
    const id = params.id;

    await connectToDatabase();

    // Try to find by MongoDB _id first, then by our custom id field
    let campaign;

    try {
      campaign = await FundItem.findById(id).lean();
    } catch (error) {
      // Continue to the next method
    }

    // If not found by _id, try to find by id field
    if (!campaign) {
      campaign = await FundItem.findOne({ id }).lean();
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Convert _id to id for frontend compatibility
    const formattedCampaign = {
      id: campaign.id || campaign._id?.toString(),
      ...campaign,
      _id: undefined
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Use React.use() to properly handle dynamic params
    const params = context.params;
    const id = params.id;

    const body = await request.json();

    await connectToDatabase();

    // Find the campaign by MongoDB _id or custom id field
    let campaign;

    try {
      campaign = await FundItem.findById(id);
    } catch (error) {
      // Continue to the next method
    }

    // If not found by _id, try to find by id field
    if (!campaign) {
      campaign = await FundItem.findOne({ id });
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update the campaign with the provided fields
    Object.keys(body).forEach(key => {
      campaign[key] = body[key];
    });

    await campaign.save();

    // Convert _id to id for frontend compatibility
    const formattedCampaign = {
      id: campaign.id || campaign._id?.toString(),
      ...campaign.toObject(),
      _id: undefined
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
