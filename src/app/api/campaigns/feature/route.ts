import { NextResponse } from 'next/server';
import { connectToDatabase, FundItem } from '@/models';

export async function POST(request: Request) {
  try {
    console.log('POST /api/campaigns/feature - Starting');
    
    // Parse request body
    const body = await request.json();
    console.log('POST /api/campaigns/feature - Request body:', body);
    
    // Validate required fields
    if (!body.id) {
      console.log('POST /api/campaigns/feature - Missing campaign ID');
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    console.log('POST /api/campaigns/feature - Connected to database');
    
    // Find the campaign by ID
    let campaign;
    const id = body.id;
    
    try {
      campaign = await FundItem.findById(id);
    } catch (error) {
      console.log(`POST /api/campaigns/feature - Error finding by _id:`, error.message);
      // Continue to the next method
    }
    
    // If not found by _id, try to find by id field
    if (!campaign) {
      console.log(`POST /api/campaigns/feature - Not found by _id, trying to find by id field`);
      campaign = await FundItem.findOne({ id });
    }
    
    if (!campaign) {
      console.log(`POST /api/campaigns/feature - Campaign not found`);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    console.log(`POST /api/campaigns/feature - Campaign found:`, campaign.name);
    
    // Update the featured status
    campaign.featured = body.featured !== false; // Default to true if not specified
    
    await campaign.save();
    console.log(`POST /api/campaigns/feature - Campaign featured status updated to:`, campaign.featured);
    
    // Convert _id to id for frontend compatibility
    const formattedCampaign = {
      id: campaign.id || campaign._id?.toString(),
      ...campaign.toObject(),
      _id: undefined
    };
    
    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error('Error featuring campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign featured status' }, { status: 500 });
  }
}
