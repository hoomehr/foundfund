import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/models';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  console.log('POST /api/contributions/direct - Starting');
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('POST /api/contributions/direct - Connected to database');
    
    // Parse request body
    const body = await request.json();
    console.log('POST /api/contributions/direct - Request body:', {
      fundItemId: body.fundItemId,
      userId: body.userId,
      amount: body.amount,
      stripeSessionId: body.stripeSessionId
    });
    
    // Check if a contribution with this Stripe session ID already exists
    if (body.stripeSessionId) {
      console.log(`POST /api/contributions/direct - Checking for existing contribution with session ID: ${body.stripeSessionId}`);
      
      const existingContribution = await mongoose.connection.db.collection('contributions').findOne({ 
        stripeSessionId: body.stripeSessionId 
      });
      
      if (existingContribution) {
        console.log(`POST /api/contributions/direct - Contribution already exists for session ${body.stripeSessionId}`);
        
        // Return the existing contribution
        return NextResponse.json({
          id: existingContribution.id || existingContribution._id.toString(),
          ...existingContribution,
          _id: undefined
        });
      } else {
        console.log(`POST /api/contributions/direct - No existing contribution found for session ${body.stripeSessionId}`);
      }
    }
    
    // Generate a unique ID
    const contributionId = uuidv4();
    console.log(`POST /api/contributions/direct - Generated new ID: ${contributionId}`);
    
    // Create contribution document
    const contributionData = {
      _id: new mongoose.Types.ObjectId(),
      id: contributionId,
      fundItemId: body.fundItemId,
      userId: body.userId,
      amount: body.amount,
      message: body.message || '',
      anonymous: body.anonymous || false,
      status: body.status || 'completed',
      stripeSessionId: body.stripeSessionId,
      createdAt: new Date()
    };
    
    console.log('POST /api/contributions/direct - Contribution data:', {
      id: contributionId,
      fundItemId: body.fundItemId,
      amount: body.amount,
      stripeSessionId: body.stripeSessionId
    });
    
    try {
      // Insert directly into MongoDB collection
      const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);
      
      console.log('POST /api/contributions/direct - Contribution created with MongoDB ID:', result.insertedId);
      console.log('POST /api/contributions/direct - Contribution created with custom ID:', contributionId);
      
      // Update campaign stats
      const campaignId = body.fundItemId;
      console.log(`POST /api/contributions/direct - Updating campaign ${campaignId} with amount ${body.amount}`);
      
      try {
        // Find the campaign directly in MongoDB
        const campaign = await mongoose.connection.db.collection('funditems').findOne({ 
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
            { id: campaignId }
          ]
        });
        
        if (!campaign) {
          console.error(`POST /api/contributions/direct - Campaign not found: ${campaignId}`);
        } else {
          console.log(`POST /api/contributions/direct - Found campaign: ${campaign.name}`);
          
          // Get current stats for logging
          const previousAmount = campaign.currentAmount || 0;
          const previousContributionsCount = campaign.contributionsCount || 0;
          const previousUniqueContributorsCount = campaign.uniqueContributorsCount || 0;
          
          // Check if this is a new contributor
          const previousContributions = await mongoose.connection.db.collection('contributions').find({
            $or: [
              { fundItemId: campaignId, userId: body.userId },
              { campaignId: campaignId, contributorId: body.userId }
            ],
            _id: { $ne: contributionData._id }
          }).toArray();
          
          const isNewContributor = previousContributions.length === 0;
          console.log(`POST /api/contributions/direct - Is new contributor: ${isNewContributor} (found ${previousContributions.length} previous contributions)`);
          
          // Update campaign directly in MongoDB
          const updateResult = await mongoose.connection.db.collection('funditems').updateOne(
            { _id: campaign._id },
            {
              $inc: {
                currentAmount: body.amount,
                contributionsCount: 1,
                uniqueContributorsCount: isNewContributor ? 1 : 0
              },
              $set: {
                status: (previousAmount + body.amount >= campaign.fundingGoal) ? 'funded' : campaign.status
              }
            }
          );
          
          console.log('POST /api/contributions/direct - Campaign update result:', updateResult);
          
          // Verify the update
          if (updateResult.modifiedCount === 1) {
            const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });
            
            console.log('POST /api/contributions/direct - Updated campaign stats:');
            console.log(`  - Current amount: ${previousAmount} -> ${updatedCampaign.currentAmount}`);
            console.log(`  - Contributions count: ${previousContributionsCount} -> ${updatedCampaign.contributionsCount}`);
            console.log(`  - Unique contributors: ${previousUniqueContributorsCount} -> ${updatedCampaign.uniqueContributorsCount}`);
            console.log(`  - Status: ${updatedCampaign.status}`);
          } else {
            console.log('POST /api/contributions/direct - WARNING: Campaign update may not have been applied');
          }
        }
      } catch (campaignError) {
        console.error('POST /api/contributions/direct - Error updating campaign:', campaignError);
      }
      
      // Return the created contribution
      return NextResponse.json({
        id: contributionId,
        ...contributionData,
        _id: undefined
      }, { status: 201 });
    } catch (error) {
      console.error('POST /api/contributions/direct - Error creating contribution:', error);
      return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
    }
  } catch (error) {
    console.error('POST /api/contributions/direct - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
