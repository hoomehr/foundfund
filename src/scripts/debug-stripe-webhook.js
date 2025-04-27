// This script checks the Stripe webhook configuration
// Run with: node src/scripts/debug-stripe-webhook.js

require('dotenv').config();
const Stripe = require('stripe');

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
  process.exit(1);
}

// Initialize Stripe with the secret key
const stripe = new Stripe(stripeSecretKey);

async function checkWebhookConfiguration() {
  console.log('Checking Stripe webhook configuration...');
  
  try {
    // List all webhooks
    const webhooks = await stripe.webhookEndpoints.list();
    
    console.log(`Found ${webhooks.data.length} webhooks:`);
    
    if (webhooks.data.length === 0) {
      console.error('No webhooks found. You need to create a webhook endpoint in the Stripe dashboard.');
      console.log('Go to https://dashboard.stripe.com/webhooks and create a webhook endpoint with the following URL:');
      console.log(`  ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stripe/webhook`);
      console.log('Make sure to subscribe to the "checkout.session.completed" event.');
      return;
    }
    
    // Check each webhook
    let foundValidWebhook = false;
    
    for (const webhook of webhooks.data) {
      console.log(`\nWebhook ID: ${webhook.id}`);
      console.log(`URL: ${webhook.url}`);
      console.log(`Status: ${webhook.status}`);
      console.log(`Events: ${webhook.enabled_events.join(', ')}`);
      
      // Check if this webhook is for our application
      const isForOurApp = webhook.url.includes('/api/stripe/webhook');
      
      // Check if this webhook is subscribed to checkout.session.completed
      const hasCheckoutSessionCompleted = webhook.enabled_events.includes('checkout.session.completed') || 
                                         webhook.enabled_events.includes('*');
      
      if (isForOurApp && hasCheckoutSessionCompleted) {
        console.log('\n✅ Found a valid webhook for our application that is subscribed to checkout.session.completed');
        foundValidWebhook = true;
        
        // Check if we have the correct webhook secret
        if (!endpointSecret) {
          console.error('\n❌ STRIPE_WEBHOOK_SECRET is not defined in environment variables');
          console.log('You need to set the STRIPE_WEBHOOK_SECRET environment variable to the webhook signing secret.');
          console.log('You can find the webhook signing secret in the Stripe dashboard:');
          console.log('  1. Go to https://dashboard.stripe.com/webhooks');
          console.log(`  2. Click on the webhook with URL ${webhook.url}`);
          console.log('  3. Click "Reveal" next to "Signing secret"');
          console.log('  4. Copy the signing secret and set it as STRIPE_WEBHOOK_SECRET in your .env.local file');
        } else {
          console.log('\n✅ STRIPE_WEBHOOK_SECRET is defined in environment variables');
        }
      }
    }
    
    if (!foundValidWebhook) {
      console.error('\n❌ No valid webhook found for our application that is subscribed to checkout.session.completed');
      console.log('You need to create a webhook endpoint in the Stripe dashboard with the following URL:');
      console.log(`  ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stripe/webhook`);
      console.log('Make sure to subscribe to the "checkout.session.completed" event.');
    }
    
    // Check recent events
    console.log('\nChecking recent events...');
    const events = await stripe.events.list({ limit: 5 });
    
    console.log(`\nFound ${events.data.length} recent events:`);
    for (const event of events.data) {
      console.log(`\nEvent ID: ${event.id}`);
      console.log(`Type: ${event.type}`);
      console.log(`Created: ${new Date(event.created * 1000).toLocaleString()}`);
      
      if (event.type === 'checkout.session.completed') {
        console.log('This is a checkout.session.completed event');
        console.log('Session ID:', event.data.object.id);
        console.log('Metadata:', event.data.object.metadata);
      }
    }
    
  } catch (error) {
    console.error('Error checking webhook configuration:', error);
  }
}

// Run the function
checkWebhookConfiguration();
