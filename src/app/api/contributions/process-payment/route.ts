import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/models';
import { handleSuccessfulPayment } from '@/lib/payment-handler';

export async function POST(request: Request) {
  console.log('=== POST /api/contributions/process-payment - Starting ===');
  
  try {
    // Parse request body
    const body = await request.json();
    console.log('Request body:', {
      sessionId: body.sessionId,
      campaignId: body.campaignId,
      userId: body.userId,
      amount: body.amount
    });
    
    // Validate required fields
    if (!body.sessionId || !body.campaignId || !body.userId || !body.amount) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');
    
    // Process payment
    console.log('Processing payment...');
    const result = await handleSuccessfulPayment({
      sessionId: body.sessionId,
      campaignId: body.campaignId,
      userId: body.userId,
      amount: body.amount,
      message: body.message || '',
      anonymous: body.anonymous || false
    });
    
    console.log('Payment processed successfully');
    console.log('Result:', {
      created: result.created,
      contributionId: result.contribution.id,
      campaignId: result.campaign.id,
      amount: result.contribution.amount
    });
    
    return NextResponse.json({
      success: true,
      created: result.created,
      contribution: result.contribution,
      campaign: result.campaign
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
  }
}
