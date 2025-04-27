import { NextResponse } from 'next/server';
import { connectToDatabase, Transaction, Contribution, FundItem } from '@/models';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    console.log('GET /api/transactions - Starting');
    
    // Get query parameters
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const contributorId = url.searchParams.get('contributorId');
    const status = url.searchParams.get('status');
    const provider = url.searchParams.get('provider');
    const providerTransactionId = url.searchParams.get('providerTransactionId');
    
    // Build query
    const query: any = {};
    
    if (campaignId) {
      query.campaignId = campaignId;
    }
    
    if (contributorId) {
      query.contributorId = contributorId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (provider) {
      query.provider = provider;
    }
    
    if (providerTransactionId) {
      query.providerTransactionId = providerTransactionId;
    }
    
    console.log('GET /api/transactions - Query params:', query);
    
    // Connect to database
    await connectToDatabase();
    console.log('GET /api/transactions - Connected to database');
    
    // Execute query
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    console.log(`GET /api/transactions - Found transactions: ${transactions.length}`);
    
    // Format transactions for response
    const formattedTransactions = transactions.map(transaction => {
      const { _id, ...rest } = transaction.toObject();
      return {
        id: transaction.id || _id.toString(),
        ...rest,
        _id: undefined
      };
    });
    
    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/transactions - Starting');
    
    // Parse request body
    const body = await request.json();
    console.log('POST /api/transactions - Request body:', body);
    
    // Validate required fields
    if (!body.amount || !body.provider || !body.providerTransactionId || !body.campaignId || !body.contributorId) {
      console.log('POST /api/transactions - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    console.log('POST /api/transactions - Connected to database');
    
    // Check if transaction already exists with the same providerTransactionId
    const existingTransaction = await Transaction.findOne({ providerTransactionId: body.providerTransactionId });
    
    if (existingTransaction) {
      console.log(`POST /api/transactions - Transaction already exists with providerTransactionId: ${body.providerTransactionId}`);
      
      // Return the existing transaction
      const { _id, ...rest } = existingTransaction.toObject();
      return NextResponse.json({
        id: existingTransaction.id || _id.toString(),
        ...rest,
        _id: undefined
      });
    }
    
    // Create a new transaction
    const transaction = new Transaction({
      id: uuidv4(),
      ...body,
      createdAt: new Date()
    });
    
    // Save the transaction
    await transaction.save();
    console.log(`POST /api/transactions - Transaction created with ID: ${transaction.id}`);
    
    // If this is a completed transaction, update the campaign
    if (transaction.status === 'completed') {
      try {
        // Find the campaign
        const campaign = await FundItem.findOne({ id: transaction.campaignId });
        
        if (campaign) {
          // Update the campaign's current amount
          campaign.currentAmount = (campaign.currentAmount || 0) + transaction.amount;
          
          // Increment the contributions count
          campaign.contributionsCount = (campaign.contributionsCount || 0) + 1;
          
          // Check if this user has already contributed to this campaign
          const existingContributions = await Contribution.find({
            $or: [
              { campaignId: transaction.campaignId, contributorId: transaction.contributorId },
              { fundItemId: transaction.campaignId, userId: transaction.contributorId }
            ]
          });
          
          // If this is the first contribution from this user, increment the unique contributors count
          if (existingContributions.length <= 1) { // <= 1 because we might have just created one
            campaign.uniqueContributorsCount = (campaign.uniqueContributorsCount || 0) + 1;
            console.log(`POST /api/transactions - New unique contributor: ${transaction.contributorId}`);
          }
          
          // If the campaign has reached or exceeded its funding goal, update its status
          if (campaign.currentAmount >= campaign.fundingGoal && campaign.status !== 'funded') {
            campaign.status = 'funded';
            console.log(`POST /api/transactions - Campaign ${transaction.campaignId} has been fully funded!`);
          }
          
          await campaign.save();
          console.log(`POST /api/transactions - Updated campaign ${transaction.campaignId}:`);
          console.log(`  - Current amount: ${campaign.currentAmount}`);
          console.log(`  - Contributions count: ${campaign.contributionsCount}`);
          console.log(`  - Unique contributors: ${campaign.uniqueContributorsCount}`);
        } else {
          console.log(`POST /api/transactions - Campaign ${transaction.campaignId} not found for update`);
        }
      } catch (error) {
        console.error(`POST /api/transactions - Error updating campaign:`, error);
        // We don't want to fail the transaction if updating the campaign fails
      }
    }
    
    // Format transaction for response
    const { _id, ...rest } = transaction.toObject();
    const formattedTransaction = {
      id: transaction.id || _id.toString(),
      ...rest,
      _id: undefined
    };
    
    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
