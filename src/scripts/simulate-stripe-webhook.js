// This script simulates a Stripe webhook event
// Run with: node src/scripts/simulate-stripe-webhook.js <session_id> <campaign_id> <user_id> <amount>

require('dotenv').config();
const fetch = require('node-fetch');
const Stripe = require('stripe');

// Get command line arguments
const args = process.argv.slice(2);
const sessionId = args[0] || `test_session_${Date.now()}`;
const campaignId = args[1] || '680adc2a49d548cc43032cad'; // Default campaign ID
const userId = args[2] || 'user1'; // Default user ID
const amount = parseFloat(args[3] || '50'); // Default amount

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Stripe with the secret key if available
let stripe = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

async function simulateWebhook() {
  try {
    console.log(`Simulating webhook for session ${sessionId}, campaign ${campaignId}, user ${userId}, amount ${amount}`);

    // Create a mock session object
    const mockSession = {
      id: sessionId,
      object: 'checkout.session',
      amount_total: amount * 100, // Convert to cents
      metadata: {
        campaignId,
        userId,
        message: 'Test message',
        anonymous: 'false'
      },
      payment_status: 'paid',
      status: 'complete'
    };

    // Create a mock event object
    const mockEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 15)}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: mockSession
      },
      type: 'checkout.session.completed'
    };

    console.log('Mock event created');

    // Convert the event to a string
    const payload = JSON.stringify(mockEvent);

    // Create a signature if possible
    let signature = 'mock_signature';
    if (stripe && webhookSecret) {
      try {
        signature = await stripe.webhooks.generateTestHeaderString({
          payload,
          secret: webhookSecret
        });
        console.log('Generated valid Stripe signature');
      } catch (signatureError) {
        console.warn('Could not generate valid Stripe signature, using mock signature');
      }
    } else {
      console.warn('Stripe or webhook secret not available, using mock signature');
    }

    console.log('Sending webhook to local server...');

    // Send the webhook to the local server
    const response = await fetch('http://localhost:3001/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      responseData = await response.text();
    }

    console.log(`Response status: ${response.status}`);
    console.log('Response data:', responseData);

    if (response.ok) {
      console.log('✅ Webhook simulation successful');
    } else {
      console.error('❌ Webhook simulation failed');

      // Try the direct-payment endpoint as a fallback
      console.log('\nTrying direct-payment endpoint as fallback...');

      const directResponse = await fetch('http://localhost:3001/api/contributions/direct-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: campaignId,
          userId: userId,
          amount: amount,
          message: 'Test message',
          anonymous: false,
          stripeSessionId: sessionId
        })
      });

      let directResponseData;
      try {
        directResponseData = await directResponse.json();
      } catch (jsonError) {
        directResponseData = await directResponse.text();
      }

      console.log(`Response status: ${directResponse.status}`);
      console.log('Response data:', directResponseData);

      if (directResponse.ok) {
        console.log('✅ Direct payment endpoint successful');
      } else {
        console.error('❌ Direct payment endpoint failed');

        // Try the script-direct endpoint as a final fallback
        console.log('\nTrying script-direct endpoint as final fallback...');

        const scriptDirectResponse = await fetch('http://localhost:3001/api/contributions/script-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            campaignId: campaignId,
            userId: userId,
            amount: amount,
            message: 'Test message',
            anonymous: false,
            stripeSessionId: sessionId
          })
        });

        let scriptDirectResponseData;
        try {
          scriptDirectResponseData = await scriptDirectResponse.json();
        } catch (jsonError) {
          scriptDirectResponseData = await scriptDirectResponse.text();
        }

        console.log(`Response status: ${scriptDirectResponse.status}`);
        console.log('Response data:', scriptDirectResponseData);

        if (scriptDirectResponse.ok) {
          console.log('✅ Script-direct endpoint successful');
        } else {
          console.error('❌ Script-direct endpoint failed');
        }
      }
    }
  } catch (error) {
    console.error('Error simulating webhook:', error);
  }
}

// Run the function
simulateWebhook();
