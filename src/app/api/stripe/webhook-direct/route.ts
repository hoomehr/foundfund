import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/models';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  console.log('\n\n=== STRIPE DIRECT WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.text();
    console.log('Webhook payload length:', body.length);
    
    // Get the signature from the headers
    const signature = request.headers.get('stripe-signature') || '';
    console.log('Signature present:', !!signature);
    
    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      console.log('✅ Webhook event constructed successfully');
      console.log('Event type:', event.type);
      console.log('Event ID:', event.id);
      console.log('Event created:', new Date(event.created * 1000).toISOString());
    } catch (err) {
      console.error('❌ Error verifying webhook signature:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      console.log('=== CHECKOUT SESSION COMPLETED ===');
      
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session ID:', session.id);
      console.log('Session object:', JSON.stringify(session, null, 2));
      
      // Extract metadata
      const metadata = session.metadata || {};
      console.log('Session metadata:', metadata);
      
      // Extract campaign ID and user ID from metadata
      const campaignId = metadata.campaignId;
      const userId = metadata.userId;
      const message = metadata.message || '';
      const anonymous = metadata.anonymous === 'true';
      
      // Calculate amount in dollars (Stripe amounts are in cents)
      const amount = (session.amount_total || 0) / 100;
      console.log('Amount (in dollars):', amount);
      
      // Validate required metadata
      if (!campaignId || !userId) {
        console.error('❌ Missing required metadata');
        return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
      }
      
      console.log('✅ All required metadata present');
      console.log(`Processing payment: Campaign=${campaignId}, User=${userId}, Amount=${amount}, Message=${message}, Anonymous=${anonymous}`);
      
      // Connect to database
      console.log('Connecting to database...');
      await connectToDatabase();
      console.log('✅ Connected to database');
      
      // Check if contribution already exists
      const existingContribution = await mongoose.connection.db.collection('contributions').findOne({
        stripeSessionId: session.id
      });
      
      if (existingContribution) {
        console.log('✅ Contribution already exists:', existingContribution.id);
        return NextResponse.json({ 
          success: true, 
          message: 'Contribution already processed',
          contributionId: existingContribution.id
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
        amount: amount,
        message: message,
        anonymous: anonymous,
        status: 'completed',
        stripeSessionId: session.id,
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
            currentAmount: amount,
            contributionsCount: 1,
            uniqueContributorsCount: isNewContributor ? 1 : 0
          },
          $set: {
            status: (campaign.currentAmount + amount >= campaign.fundingGoal) ? 'funded' : campaign.status
          }
        }
      );
      
      console.log('✅ Campaign updated successfully:', updateResult.modifiedCount);
      
      // Get updated campaign
      const updatedCampaign = await mongoose.connection.db.collection('funditems').findOne({ _id: campaign._id });
      console.log('Updated campaign stats:');
      console.log(`- Current amount: ${campaign.currentAmount} -> ${updatedCampaign?.currentAmount}`);
      console.log(`- Contributions count: ${campaign.contributionsCount} -> ${updatedCampaign?.contributionsCount}`);
      
      console.log('\n=== WEBHOOK PROCESSING COMPLETED SUCCESSFULLY ===');
      
      return NextResponse.json({ 
        success: true, 
        contributionId,
        campaignId,
        amount
      });
    }
    
    // Return a response for other event types
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}
