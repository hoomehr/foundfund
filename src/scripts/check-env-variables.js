// This script checks the environment variables
// Run with: node src/scripts/check-env-variables.js

require('dotenv').config();

function checkEnvVariables() {
  console.log('Checking environment variables...');
  
  const requiredVariables = [
    'MONGODB_URI',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_BASE_URL'
  ];
  
  let allVariablesPresent = true;
  
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      console.error(`❌ ${variable} is not defined in environment variables`);
      allVariablesPresent = false;
    } else {
      // Mask sensitive values
      let value = process.env[variable];
      if (variable.includes('SECRET') || variable.includes('KEY') || variable.includes('URI')) {
        value = value.substring(0, 4) + '...' + value.substring(value.length - 4);
      }
      console.log(`✅ ${variable}: ${value}`);
    }
  }
  
  if (allVariablesPresent) {
    console.log('\nAll required environment variables are present');
  } else {
    console.error('\nSome required environment variables are missing');
    console.log('\nMake sure you have the following variables in your .env.local file:');
    console.log(`
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
    `);
  }
}

// Run the function
checkEnvVariables();
