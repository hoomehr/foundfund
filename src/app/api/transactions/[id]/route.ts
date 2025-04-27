import { NextResponse } from 'next/server';
import { connectToDatabase, Transaction, Contribution, FundItem } from '@/models';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    console.log(`GET /api/transactions/${id} - Starting`);

    await connectToDatabase();
    console.log(`GET /api/transactions/${id} - Connected to database`);

    // Try to find by MongoDB _id
    let transaction;
    try {
      transaction = await Transaction.findById(id);
      console.log(`GET /api/transactions/${id} - Trying to find by MongoDB _id`);
    } catch (error) {
      console.log(`GET /api/transactions/${id} - Error finding by _id:`, error.message);
      // Continue to the next method
    }

    // If not found by _id, try to find by id field
    if (!transaction) {
      console.log(`GET /api/transactions/${id} - Not found by _id, trying to find by id field`);
      transaction = await Transaction.findOne({ id });
    }

    // If not found by id field, try to find by providerTransactionId
    if (!transaction) {
      console.log(`GET /api/transactions/${id} - Not found by id, trying to find by providerTransactionId`);
      transaction = await Transaction.findOne({ providerTransactionId: id });
    }

    if (!transaction) {
      console.log(`GET /api/transactions/${id} - Transaction not found`);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    console.log(`GET /api/transactions/${id} - Transaction found`);

    // Format transaction for response
    const { _id, ...rest } = transaction.toObject();
    const formattedTransaction = {
      id: transaction.id || _id.toString(),
      ...rest,
      _id: undefined
    };

    console.log(`GET /api/transactions/${id} - Returning formatted transaction`);
    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error(`Error fetching transaction ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    console.log(`PATCH /api/transactions/${id} - Starting`);

    // Parse request body
    const body = await request.json();
    console.log(`PATCH /api/transactions/${id} - Request body:`, body);

    await connectToDatabase();
    console.log(`PATCH /api/transactions/${id} - Connected to database`);

    // Try to find by MongoDB _id
    let transaction;
    try {
      transaction = await Transaction.findById(id);
    } catch (error) {
      console.log(`PATCH /api/transactions/${id} - Error finding by _id:`, error.message);
      // Continue to the next method
    }

    // If not found by _id, try to find by id field
    if (!transaction) {
      console.log(`PATCH /api/transactions/${id} - Not found by _id, trying to find by id field`);
      transaction = await Transaction.findOne({ id });
    }

    // If not found by id field, try to find by providerTransactionId
    if (!transaction) {
      console.log(`PATCH /api/transactions/${id} - Not found by id, trying to find by providerTransactionId`);
      transaction = await Transaction.findOne({ providerTransactionId: id });
    }

    if (!transaction) {
      console.log(`PATCH /api/transactions/${id} - Transaction not found`);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    console.log(`PATCH /api/transactions/${id} - Transaction found`);

    // Check if status is changing from non-completed to completed
    const isCompletingTransaction = 
      transaction.status !== 'completed' && 
      body.status === 'completed';

    // Update status-related timestamps
    if (body.status && body.status !== transaction.status) {
      if (body.status === 'completed' && !body.completedAt) {
        body.completedAt = new Date();
      } else if (body.status === 'failed' && !body.failedAt) {
        body.failedAt = new Date();
      } else if (body.status === 'refunded' && !body.refundedAt) {
        body.refundedAt = new Date();
      }
    }

    // Update transaction
    Object.keys(body).forEach(key => {
      transaction[key] = body[key];
    });

    // Always update the updatedAt field
    transaction.updatedAt = new Date();

    await transaction.save();
    console.log(`PATCH /api/transactions/${id} - Transaction updated`);

    // If the transaction is being completed, update the campaign
    if (isCompletingTransaction) {
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
            console.log(`PATCH /api/transactions/${id} - New unique contributor: ${transaction.contributorId}`);
          }
          
          // If the campaign has reached or exceeded its funding goal, update its status
          if (campaign.currentAmount >= campaign.fundingGoal && campaign.status !== 'funded') {
            campaign.status = 'funded';
            console.log(`PATCH /api/transactions/${id} - Campaign ${transaction.campaignId} has been fully funded!`);
          }
          
          await campaign.save();
          console.log(`PATCH /api/transactions/${id} - Updated campaign ${transaction.campaignId}:`);
          console.log(`  - Current amount: ${campaign.currentAmount}`);
          console.log(`  - Contributions count: ${campaign.contributionsCount}`);
          console.log(`  - Unique contributors: ${campaign.uniqueContributorsCount}`);
        } else {
          console.log(`PATCH /api/transactions/${id} - Campaign ${transaction.campaignId} not found for update`);
        }
      } catch (error) {
        console.error(`PATCH /api/transactions/${id} - Error updating campaign:`, error);
        // We don't want to fail the transaction update if updating the campaign fails
      }
    }

    // Format transaction for response
    const { _id, ...rest } = transaction.toObject();
    const formattedTransaction = {
      id: transaction.id || _id.toString(),
      ...rest,
      _id: undefined
    };

    console.log(`PATCH /api/transactions/${id} - Returning formatted transaction`);
    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error(`Error updating transaction ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
