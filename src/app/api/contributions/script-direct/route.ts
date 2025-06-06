import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/models';
import { handleSuccessfulPayment } from '@/lib/payment-handler';

// This endpoint uses our robust payment handler
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
    const sessionId = body.stripeSessionId || `manual-session-${Date.now()}`;
    const message = body.message || '';
    const anonymous = body.anonymous || false;

    if (!campaignId || !userId || !amount) {
      console.error('POST /api/contributions/script-direct - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Process the payment using our robust payment handler
    console.log('POST /api/contributions/script-direct - Processing payment with payment handler');

    const result = await handleSuccessfulPayment({
      sessionId,
      campaignId,
      userId,
      amount,
      message,
      anonymous
    });

    console.log('POST /api/contributions/script-direct - Payment processed successfully');
    console.log('POST /api/contributions/script-direct - Result:', {
      created: result.created,
      contributionId: result.contribution.id,
      campaignId: result.campaign.id,
      amount: result.contribution.amount
    });

    // Return success response
    return NextResponse.json({
      success: true,
      contribution: result.contribution,
      campaign: result.campaign,
      created: result.created
    });
  } catch (error) {
    console.error('POST /api/contributions/script-direct - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
