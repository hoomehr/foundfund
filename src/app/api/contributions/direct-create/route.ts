import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/models';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  console.log('\n\n=== DIRECT CREATE CONTRIBUTION API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Parse request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Extract parameters
    const { sessionId, campaignId, userId, amount, message = '', anonymous = false } = body;
    
    // Validate required parameters
    if (!sessionId || !campaignId || !userId || !amount) {
      console.error('❌ Missing required parameters');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Connect to database
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database');
    
    // Check if contribution already exists
    const existingContribution = await mongoose.connection.db.collection('contributions').findOne({
      stripeSessionId: sessionId
    });
    
    if (existingContribution) {
      console.log('✅ Contribution already exists:', existingContribution.id);
      
      // Find campaign
      const campaign = await mongoose.connection.db.collection('funditems').findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
          { id: campaignId }
        ]
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Contribution already processed',
        contribution: existingContribution,
        campaign: campaign || {}
      });
    }
    
    // Create contribution
    console.log('Creating new contribution...');
    const contributionId = uuidv4();
    
    const contributionData = {
      _id: new mongoose.Types.ObjectId(),
      id: contributionId,
      fundItemId: campaignId,
      userId: userId,
      amount: parseFloat(amount.toString()),
      message: message || '',
      anonymous: typeof anonymous === 'string' ? anonymous === 'true' : Boolean(anonymous),
      status: 'completed',
      stripeSessionId: sessionId,
      createdAt: new Date()
    };
    
    console.log('Contribution data:', JSON.stringify(contributionData, null, 2));
    
    // Insert contribution
    const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);
    console.log('✅ Contribution created successfully:', result.insertedId);
    
    // Find campaign
    const campaign = await mongoose.connection.db.collection('funditems').findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
        { id: campaignId }
      ]
    });
    
    if (!campaign) {
      console.error(`❌ Campaign not found: ${campaignId}`);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    console.log('✅ Found campaign:', campaign.name);
    
    // Check if this is a new contributor
    const previousContributions = await mongoose.connection.db.collection('contributions').find({
      $or: [
        { fundItemId: campaignId, userId: userId },
        { campaignId: campaignId, contributorId: userId }
      ],
      _id: { $ne: contributionData._id }
    }).toArray();
    
    const isNewContributor = previousContributions.length === 0;
    console.log(`Is new contributor: ${isNewContributor}`);
    
    // Update campaign
    const updateResult = await mongoose.connection.db.collection('funditems').updateOne(
      { _id: campaign._id },
      {
        $inc: {
          currentAmount: parseFloat(amount.toString()),
          contributionsCount: 1,
          uniqueContributorsCount: isNewContributor ? 1 : 0
        },
        $set: {
          status: (campaign.currentAmount + parseFloat(amount.toString()) >= campaign.fundingGoal) ? 'funded' : campaign.status
        }
      }
    );
    
    console.log('✅ Campaign updated successfully:', updateResult.modifiedCount);
    
    // Get updated campaign
    const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });
    console.log('Updated campaign stats:');
    console.log(`- Current amount: ${campaign.currentAmount} -> ${updatedCampaign?.currentAmount}`);
    console.log(`- Contributions count: ${campaign.contributionsCount} -> ${updatedCampaign?.contributionsCount}`);
    
    console.log('\n=== DIRECT CREATE CONTRIBUTION COMPLETED SUCCESSFULLY ===');
    
    return NextResponse.json({ 
      success: true, 
      created: true,
      contribution: contributionData,
      campaign: updatedCampaign || campaign
    });
  } catch (error) {
    console.error('❌ Error creating contribution:', error);
    return NextResponse.json({ error: 'Error creating contribution' }, { status: 500 });
  }
}
