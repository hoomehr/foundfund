import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/models';
import { handleSuccessfulPayment } from '@/lib/payment-handler';

export async function POST(request: Request) {
  console.log('POST /api/contributions/direct-payment - Starting');
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('POST /api/contributions/direct-payment - Connected to database');
    
    // Parse request body
    const body = await request.json();
    console.log('POST /api/contributions/direct-payment - Request body:', {
      campaignId: body.campaignId || body.fundItemId,
      userId: body.userId,
      amount: body.amount,
      stripeSessionId: body.stripeSessionId
    });
    
    // Extract data
    const sessionId = body.stripeSessionId;
    const campaignId = body.campaignId || body.fundItemId;
    const userId = body.userId;
    const amount = body.amount;
    const message = body.message || '';
    const anonymous = body.anonymous || false;
    
    if (!sessionId || !campaignId || !userId || !amount) {
      console.error('POST /api/contributions/direct-payment - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Process the payment using our robust payment handler
    console.log('POST /api/contributions/direct-payment - Processing payment');
    
    const result = await handleSuccessfulPayment({
      sessionId,
      campaignId,
      userId,
      amount,
      message,
      anonymous
    });
    
    console.log('POST /api/contributions/direct-payment - Payment processed successfully');
    console.log('POST /api/contributions/direct-payment - Result:', {
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
    console.error('POST /api/contributions/direct-payment - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
