// This script tests the payment success page by making a direct API call
// Run with: node src/scripts/test-payment-success.js <session_id> <campaign_id> <user_id> <amount>

require('dotenv').config();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Get command line arguments
const args = process.argv.slice(2);
const sessionId = args[0] || `test_session_${Date.now()}`;
const campaignId = args[1] || '680adc2a49d548cc43032cad'; // Default campaign ID
const userId = args[2] || 'user1'; // Default user ID
const amount = parseFloat(args[3] || '50'); // Default amount

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
}

// Check if a contribution exists
async function checkContribution(sessionId) {
  try {
    console.log(`Checking for contribution with session ID: ${sessionId}`);
    
    const contribution = await mongoose.connection.db.collection('contributions').findOne({
      stripeSessionId: sessionId
    });
    
    if (contribution) {
      console.log('Contribution found:', contribution);
      return true;
    } else {
      console.log('No contribution found');
      return false;
    }
  } catch (error) {
    console.error('Error checking contribution:', error);
    return false;
  }
}

// Test the payment success page
async function testPaymentSuccess() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      return;
    }
    
    // Check if contribution already exists
    const contributionExists = await checkContribution(sessionId);
    if (contributionExists) {
      console.log('Contribution already exists, creating a new session ID');
      sessionId = `test_session_${Date.now()}`;
    }
    
    console.log(`Testing payment success for session ${sessionId}, campaign ${campaignId}, user ${userId}, amount ${amount}`);
    
    // Test the direct API endpoint
    console.log('\nTesting /api/contributions/direct endpoint...');
    
    const directResponse = await fetch('http://localhost:3001/api/contributions/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fundItemId: campaignId,
        userId: userId,
        amount: amount,
        message: 'Test message',
        anonymous: false,
        status: 'completed',
        stripeSessionId: sessionId,
        createdAt: new Date().toISOString(),
      }),
    });
    
    const directData = await directResponse.json();
    
    console.log(`Response status: ${directResponse.status}`);
    console.log('Response data:', directData);
    
    // Check if contribution was created
    const contributionCreated = await checkContribution(sessionId);
    
    if (contributionCreated) {
      console.log('✅ Contribution was successfully created');
    } else {
      console.error('❌ Contribution was not created');
    }
    
    // Test the script-direct endpoint
    console.log('\nTesting /api/contributions/script-direct endpoint...');
    
    const newSessionId = `test_session_${Date.now()}`;
    
    const scriptDirectResponse = await fetch('http://localhost:3001/api/contributions/script-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId: campaignId,
        userId: userId,
        amount: amount,
        message: 'Test message',
        anonymous: false,
        stripeSessionId: newSessionId,
      }),
    });
    
    const scriptDirectData = await scriptDirectResponse.json();
    
    console.log(`Response status: ${scriptDirectResponse.status}`);
    console.log('Response data:', scriptDirectData);
    
    // Check if contribution was created
    const scriptDirectContributionCreated = await checkContribution(newSessionId);
    
    if (scriptDirectContributionCreated) {
      console.log('✅ Contribution was successfully created with script-direct endpoint');
    } else {
      console.error('❌ Contribution was not created with script-direct endpoint');
    }
    
    // Test the regular contributions endpoint
    console.log('\nTesting /api/contributions endpoint...');
    
    const regularSessionId = `test_session_${Date.now()}`;
    
    const regularResponse = await fetch('http://localhost:3001/api/contributions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fundItemId: campaignId,
        userId: userId,
        amount: amount,
        message: 'Test message',
        anonymous: false,
        status: 'completed',
        stripeSessionId: regularSessionId,
        createdAt: new Date().toISOString(),
      }),
    });
    
    const regularData = await regularResponse.json();
    
    console.log(`Response status: ${regularResponse.status}`);
    console.log('Response data:', regularData);
    
    // Check if contribution was created
    const regularContributionCreated = await checkContribution(regularSessionId);
    
    if (regularContributionCreated) {
      console.log('✅ Contribution was successfully created with regular endpoint');
    } else {
      console.error('❌ Contribution was not created with regular endpoint');
    }
    
  } catch (error) {
    console.error('Error testing payment success:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
testPaymentSuccess();
