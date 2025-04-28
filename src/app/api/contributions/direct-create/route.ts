import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/models';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Extract parameters
    const { sessionId, campaignId, userId, amount, message = '', anonymous = false } = body;

    // Validate required parameters
    if (!sessionId || !campaignId || !userId || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Check if contribution already exists
    const existingContribution = await mongoose.connection.db.collection('contributions').findOne({
      stripeSessionId: sessionId
    });

    if (existingContribution) {
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

    // Insert contribution
    const result = await mongoose.connection.db.collection('contributions').insertOne(contributionData);

    // Find campaign
    const campaign = await mongoose.connection.db.collection('funditems').findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null },
        { id: campaignId }
      ]
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

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
          currentAmount: parseFloat(amount.toString()),
          contributionsCount: 1,
          uniqueContributorsCount: isNewContributor ? 1 : 0
        },
        $set: {
          status: (campaign.currentAmount + parseFloat(amount.toString()) >= campaign.fundingGoal) ? 'funded' : campaign.status
        }
      }
    );

    // Get updated campaign
    const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });

    return NextResponse.json({
      success: true,
      created: true,
      contribution: contributionData,
      campaign: updatedCampaign || campaign
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating contribution' }, { status: 500 });
  }
}
