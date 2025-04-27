import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/models';
import { handleSuccessfulPayment } from '@/lib/payment-handler';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  console.log('\n\n=== POST /api/contributions/process-payment - Starting ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body successfully parsed');
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    console.log('Full request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const missingFields = [];
    if (!body.sessionId) missingFields.push('sessionId');
    if (!body.campaignId) missingFields.push('campaignId');
    if (!body.userId) missingFields.push('userId');
    if (body.amount === undefined || body.amount === null) missingFields.push('amount');

    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate amount is a number
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error(`❌ Invalid amount: ${body.amount}`);
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    // Check MongoDB connection state
    console.log('MongoDB connection state before connecting:',
      mongoose.connection.readyState,
      getConnectionStateDescription(mongoose.connection.readyState)
    );

    // Connect to database
    try {
      await connectToDatabase();
      console.log('✅ Connected to database');
      console.log('MongoDB connection state after connecting:',
        mongoose.connection.readyState,
        getConnectionStateDescription(mongoose.connection.readyState)
      );
      console.log('MongoDB database name:', mongoose.connection.db?.databaseName);

      // List available collections
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
      } catch (collError) {
        console.error('❌ Error listing collections:', collError);
      }
    } catch (dbError) {
      console.error('❌ Error connecting to database:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Process payment
    console.log('\n=== PROCESSING PAYMENT WITH PAYMENT HANDLER ===');
    console.log('Payment details:');
    console.log(`- Session ID: ${body.sessionId}`);
    console.log(`- Campaign ID: ${body.campaignId}`);
    console.log(`- User ID: ${body.userId}`);
    console.log(`- Amount: ${amount}`);
    console.log(`- Message: ${body.message || 'N/A'}`);
    console.log(`- Anonymous: ${body.anonymous ? 'Yes' : 'No'}`);

    let result;
    try {
      result = await handleSuccessfulPayment({
        sessionId: body.sessionId,
        campaignId: body.campaignId,
        userId: body.userId,
        amount: amount,
        message: body.message || '',
        anonymous: body.anonymous || false
      });

      console.log('✅ Payment processed successfully');
      console.log('Result:', {
        created: result.created,
        contributionId: result.contribution?.id,
        campaignId: result.campaign?.id,
        amount: result.contribution?.amount
      });
    } catch (paymentError) {
      console.error('❌ Error in payment handler:', paymentError);

      // Try to get more details about the error
      if (paymentError instanceof Error) {
        console.error('Error name:', paymentError.name);
        console.error('Error message:', paymentError.message);
        console.error('Error stack:', paymentError.stack);
      }

      return NextResponse.json({
        error: 'Payment processing failed',
        details: paymentError instanceof Error ? paymentError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Verify the result
    if (!result || !result.contribution || !result.campaign) {
      console.error('❌ Payment handler returned incomplete result:', result);
      return NextResponse.json({ error: 'Incomplete payment result' }, { status: 500 });
    }

    console.log('\n=== PAYMENT PROCESSING COMPLETED SUCCESSFULLY ===');

    return NextResponse.json({
      success: true,
      created: result.created,
      contribution: result.contribution,
      campaign: result.campaign
    });
  } catch (error) {
    console.error('❌ Unhandled error in process-payment API:', error);

    // Try to get more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json({
      error: 'Unhandled error processing payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get a human-readable description of the MongoDB connection state
function getConnectionStateDescription(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    case 99: return 'uninitialized';
    default: return 'unknown';
  }
}
