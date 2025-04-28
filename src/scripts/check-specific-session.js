require('dotenv').config();
const mongoose = require('mongoose');

async function checkSpecificSession(sessionId) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log(`Checking for contribution with session ID: ${sessionId}`);
    const contribution = await mongoose.connection.db.collection('contributions').findOne({
      stripeSessionId: sessionId
    });

    if (contribution) {
      console.log('Found contribution:');
      console.log('  ID:', contribution.id);
      console.log('  User ID:', contribution.userId);
      console.log('  Amount:', contribution.amount);
      console.log('  Status:', contribution.status);
      console.log('  Created At:', new Date(contribution.createdAt));
      console.log('  Stripe Session ID:', contribution.stripeSessionId);
      console.log('\nFull contribution data:');
      console.log(JSON.stringify(contribution, null, 2));
    } else {
      console.log('No contribution found with session ID:', sessionId);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Get session ID from command line arguments
const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Please provide a session ID as a command line argument');
  process.exit(1);
}

checkSpecificSession(sessionId);
