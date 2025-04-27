import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/models';
import { v4 as uuidv4 } from 'uuid';

// This endpoint uses the exact same approach as the working script
export async function POST(request: Request) {
  console.log('POST /api/contributions/script-direct - Starting');
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('POST /api/contributions/script-direct - Connected to database');
    
    // Parse request body
    const body = await request.json();
    console.log('POST /api/contributions/script-direct - Request body:', {
      campaignId: body.campaignId || body.fundItemId,
      userId: body.userId,
      amount: body.amount,
      stripeSessionId: body.stripeSessionId
    });
    
    // Extract data
    const campaignId = body.campaignId || body.fundItemId;
    const userId = body.userId;
    const amount = body.amount;
    const sessionId = body.stripeSessionId;
    const message = body.message || '';
    const anonymous = body.anonymous || false;
    
    if (!campaignId || !userId || !amount) {
      console.error('POST /api/contributions/script-direct - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if a contribution with this session ID already exists
    if (sessionId) {
      console.log(`POST /api/contributions/script-direct - Checking for existing contribution with session ID: ${sessionId}`);
      
      const existingContribution = await mongoose.connection.db.collection('contributions').findOne({ 
        stripeSessionId: sessionId 
      });
      
      if (existingContribution) {
        console.log(`POST /api/contributions/script-direct - Contribution already exists for session ${sessionId}`);
        
        // Return the existing contribution
        return NextResponse.json({
          id: existingContribution.id || existingContribution._id.toString(),
          ...existingContribution,
          _id: undefined
        });
      }
    }
    
    // Create contribution document - USING EXACT SCRIPT APPROACH
    const contributionId = uuidv4();
    console.log(`POST /api/contributions/script-direct - Generated new ID: ${contributionId}`);
    
    const contributionData = {
      _id: new mongoose.Types.ObjectId(),
      id: contributionId,
      fundItemId: campaignId,
      userId: userId,
      amount: amount,
      message: message,
      anonymous: anonymous,
      status: 'completed',
      stripeSessionId: sessionId,
      createdAt: new Date()
    };
    
    console.log('POST /api/contributions/script-direct - Contribution data:', contributionData);
    
    // Insert directly into MongoDB collection
    const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);
    
    console.log('POST /api/contributions/script-direct - Contribution added with ID:', result.insertedId);
    console.log('POST /api/contributions/script-direct - Contribution added with custom ID:', contributionId);
    
    // Update campaign stats
    console.log(`POST /api/contributions/script-direct - Updating campaign ${campaignId} with amount ${amount}`);
    
    // Find campaign
    const campaign = await mongoose.connection.db.collection('funditems').findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
        { id: campaignId }
      ]
    });
    
    if (!campaign) {
      console.error(`POST /api/contributions/script-direct - Campaign not found: ${campaignId}`);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    console.log(`POST /api/contributions/script-direct - Found campaign: ${campaign.name}`);
    
    // Update campaign stats
    const previousAmount = campaign.currentAmount || 0;
    const previousContributionsCount = campaign.contributionsCount || 0;
    const previousUniqueContributorsCount = campaign.uniqueContributorsCount || 0;
    
    // Check if this is a new contributor
    const previousContributions = await mongoose.connection.db.collection('contributions').find({
      $or: [
        { fundItemId: campaignId, userId: userId },
        { campaignId: campaignId, contributorId: userId }
      ],
      _id: { $ne: contributionData._id }
    }).toArray();
    
    const isNewContributor = previousContributions.length === 0;
    
    // Update campaign
    const updateResult = await mongoose.connection.db.collection('funditems').updateOne(
      { _id: campaign._id },
      {
        $inc: {
          currentAmount: amount,
          contributionsCount: 1,
          uniqueContributorsCount: isNewContributor ? 1 : 0
        },
        $set: {
          status: (previousAmount + amount >= campaign.fundingGoal) ? 'funded' : campaign.status
        }
      }
    );
    
    console.log('POST /api/contributions/script-direct - Campaign update result:', updateResult);
    
    // Verify the update
    const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });
    
    console.log('POST /api/contributions/script-direct - Updated campaign stats:');
    console.log(`  - Current amount: ${previousAmount} -> ${updatedCampaign.currentAmount}`);
    console.log(`  - Contributions count: ${previousContributionsCount} -> ${updatedCampaign.contributionsCount}`);
    console.log(`  - Unique contributors: ${previousUniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      contribution: {
        id: contributionId,
        amount: amount,
        campaignId: campaignId,
        userId: userId,
        stripeSessionId: sessionId
      },
      campaign: {
        id: campaign.id,
        name: campaign.name,
        currentAmount: updatedCampaign.currentAmount,
        contributionsCount: updatedCampaign.contributionsCount,
        uniqueContributorsCount: updatedCampaign.uniqueContributorsCount
      }
    });
  } catch (error) {
    console.error('POST /api/contributions/script-direct - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
