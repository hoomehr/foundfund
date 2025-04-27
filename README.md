# FoundFund

FoundFund is a modern micro-funding platform that connects creators with funders. Built with Next.js, TypeScript, and MongoDB, it provides a sleek, user-friendly interface for discovering, creating, and contributing to campaigns.

## Features

- **Discover Campaigns**: Browse through a curated list of campaigns with filtering options
- **Create Campaigns**: Easily create and manage your own funding campaigns
- **Contribute to Projects**: Support campaigns with secure Stripe payments
- **User Dashboard**: Track your created campaigns and contributions
- **Analytics**: View detailed analytics about your campaigns and investments
- **Payment Processing**: Secure payment processing with Stripe
- **Responsive Design**: Optimized for both desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Payment Processing**: Stripe
- **Authentication**: Custom auth with JWT
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- MongoDB database (local or Atlas)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

> **Note**: For Stripe integration, you'll need to create a Stripe account and obtain API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys). For testing, use Stripe's test mode keys.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/foundfund.git
cd foundfund
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000/foundfund/funders](http://localhost:3000/foundfund/funders) to see the discover page.

## Project Structure

```
foundfund/
├── public/                # Static assets
│   └── uploads/           # Uploaded campaign images
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   │   ├── campaigns/     # Campaign-related endpoints
│   │   │   ├── contributions/ # Contribution-related endpoints
│   │   │   ├── stripe/        # Stripe payment endpoints
│   │   │   │   ├── checkout/      # Stripe checkout endpoint
│   │   │   │   └── webhook/       # Stripe webhook handler
│   │   │   ├── upload/        # File upload endpoint
│   │   │   └── users/         # User-related endpoints
│   │   ├── foundfund/     # Main application routes
│   │   │   ├── creators/      # Creator dashboard pages
│   │   │   │   ├── campaigns/     # Campaign management
│   │   │   │   ├── edit/          # Campaign editing
│   │   │   │   └── new/           # New campaign creation
│   │   │   ├── funders/       # Discover page for funders
│   │   │   ├── investments/   # Investment tracking page
│   │   │   ├── login/         # Authentication pages
│   │   │   ├── payment/       # Payment-related pages
│   │   │   │   └── success/       # Payment success page
│   │   │   └── projects/      # Campaign details pages
│   ├── components/        # Reusable UI components
│   │   ├── campaign/      # Campaign-related components
│   │   ├── contribution/  # Contribution-related components
│   │   ├── layout/        # Layout components
│   │   ├── modals/        # Modal components
│   │   └── ui/            # UI components
│   ├── contexts/          # React contexts
│   ├── data/              # Mock data
│   ├── lib/               # Utility functions
│   │   └── api/           # API client functions
│   ├── models/            # MongoDB models
│   ├── scripts/           # Utility scripts
│   └── types/             # TypeScript type definitions
├── .env.local             # Environment variables
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Key Pages

### Main Pages
- `/foundfund/funders` - Discover page for browsing campaigns
- `/foundfund/creators` - Dashboard for creators to manage campaigns
- `/foundfund/investments` - Track your contributions to campaigns
- `/foundfund/projects/[id]` - Campaign details page

### Creator Pages
- `/foundfund/creators/new` - Create a new campaign
- `/foundfund/creators/edit/[id]` - Edit an existing campaign
- `/foundfund/creators/campaigns/[id]` - View campaign details as a creator

### Payment Pages
- `/foundfund/payment/success` - Payment success page after Stripe checkout

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns with optional filters
- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns/[id]` - Get a specific campaign
- `PATCH /api/campaigns/[id]` - Update a campaign

### Contributions
- `GET /api/contributions` - List contributions with optional filters
- `POST /api/contributions` - Create a new contribution
- `POST /api/contributions/direct` - Create a contribution using direct MongoDB operations

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create a new user

### File Upload
- `POST /api/upload` - Upload images for campaigns

### Stripe Payment Processing
- `POST /api/stripe/checkout` - Create a Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events

## Payment Handling

FoundFund uses Stripe for secure payment processing. The payment flow works as follows:

### Payment Flow

1. **Checkout Initiation**:
   - When a user clicks "Contribute" on a campaign details page, a Stripe checkout session is created via the `/api/stripe/checkout` endpoint.
   - The session includes metadata about the campaign, user, and contribution details.

2. **Stripe Checkout**:
   - The user is redirected to Stripe's hosted checkout page.
   - After completing payment, Stripe redirects the user back to the success page.

3. **Success Page**:
   - The success page (`/foundfund/payment/success`) receives the session ID and other metadata.
   - It attempts to create a contribution record in the database using the `/api/contributions/direct` endpoint.
   - If that fails, it falls back to the regular `/api/contributions` endpoint.
   - As a last resort, it directly updates the campaign stats.
   - It displays a success message with campaign details.

4. **Webhook Processing**:
   - Stripe also sends a webhook event to `/api/stripe/webhook` when the payment is completed.
   - The webhook handler creates a contribution record if one doesn't exist yet.
   - It updates the campaign's funding stats (current amount, contributions count, unique contributors).

> **Note**: The system implements multiple redundant approaches to ensure contributions are properly recorded. Both the success page and webhook handler attempt to create contributions, with checks to prevent duplicates. This redundancy ensures that even if one approach fails, the other can still record the contribution.

### Database Updates

Each successful payment results in:
1. A new contribution record with the Stripe session ID
2. Updated campaign stats (current amount, contributions count)
3. Incremented unique contributors count (if it's the first contribution from that user)

### Testing Payments

For testing, use Stripe's test cards:
- Card number: `4242 4242 4242 4242`
- Expiration date: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Troubleshooting Payment Issues

If contributions are not being properly recorded after payments:

1. **Check Stripe Webhook Setup**:
   - Ensure the Stripe webhook is properly configured in the Stripe Dashboard.
   - The webhook should point to your application's webhook endpoint (`/api/stripe/webhook`).
   - The webhook should be configured to listen for the `checkout.session.completed` event.
   - Verify that the webhook secret is correctly set in your environment variables.
   - Use the script at `src/scripts/debug-stripe-webhook.js` to check the webhook configuration.
     - Run with: `node src/scripts/debug-stripe-webhook.js`

2. **Check MongoDB Connection**:
   - Ensure the MongoDB connection string is correct in your environment variables.
   - Check the MongoDB logs for any connection issues.
   - Verify that the MongoDB user has write permissions to the database.
   - Use the script at `src/scripts/debug-mongodb-connection.js` to test the MongoDB connection.
     - Run with: `node src/scripts/debug-mongodb-connection.js`

3. **Check Environment Variables**:
   - Verify that all required environment variables are set correctly.
   - Use the script at `src/scripts/check-env-variables.js` to check the environment variables.
     - Run with: `node src/scripts/check-env-variables.js`

4. **Check Server Logs**:
   - Look for any error messages in the server logs related to Stripe or MongoDB.
   - Check for any failed API calls to `/api/contributions/direct` or `/api/contributions`.
   - Look for logs with `❌` which indicate errors.

5. **Test Payment Success Page**:
   - Use the script at `src/scripts/test-payment-success.js` to test the payment success page.
     - Run with: `node src/scripts/test-payment-success.js <session_id> <campaign_id> <user_id> <amount>`
     - Example: `node src/scripts/test-payment-success.js test_session_123 680adc2a49d548cc43032cad user1 50`

6. **Simulate Stripe Webhook**:
   - Use the script at `src/scripts/simulate-stripe-webhook.js` to simulate a Stripe webhook event.
     - Run with: `node src/scripts/simulate-stripe-webhook.js <session_id> <campaign_id> <user_id> <amount>`
     - Example: `node src/scripts/simulate-stripe-webhook.js test_session_123 680adc2a49d548cc43032cad user1 50`

7. **Manual Contribution Creation**:
   - If automatic contribution creation is failing, you can use the following scripts to manually create contributions:
     - `src/scripts/add-contribution.js`: General-purpose script for adding contributions.
       - Run with: `node src/scripts/add-contribution.js`
     - `src/scripts/add-stripe-contribution.js`: Script for adding contributions for specific Stripe sessions.
       - Run with: `node src/scripts/add-stripe-contribution.js <session_id> <campaign_id> <user_id> <amount>`
       - Example: `node src/scripts/add-stripe-contribution.js cs_test_a1xEy6qhmI0xHkpQ9ikLf8py3D1nuhqiOLaFWwZuyt7v0dO5P8jrpKNVab 680adc2a49d548cc43032cad user1 50`
     - `src/scripts/add-contribution-for-session.js`: Script for adding contributions for specific Stripe sessions (more reliable).
       - Run with: `node src/scripts/add-contribution-for-session.js <session_id> <campaign_id> <user_id> <amount>`
       - Example: `node src/scripts/add-contribution-for-session.js cs_test_a1fjo3L3AUN64NGMFs4S9bcCPJSdKeBQlKYYc1uPqZlQy6BygWpj9WfL3R 680adc2a49d548cc43032cad user1 109`

8. **Check Contributions**:
   - Use the script at `src/scripts/check-contributions.js` to check the current contributions for a campaign.
   - Run with: `node src/scripts/check-contributions.js`

9. **Verify Stripe Events**:
   - Check the Stripe Dashboard for any failed webhook events.
   - Verify that the webhook events are being sent to your application.
   - Use the Stripe CLI to test webhook events locally.
   - Run: `stripe listen --forward-to http://localhost:3001/api/stripe/webhook`

10. **Common Issues and Solutions**:
    - **Webhook Not Receiving Events**: Make sure the webhook URL is publicly accessible. Use a service like ngrok to expose your local server to the internet.
    - **MongoDB Connection Issues**: Check that your MongoDB URI is correct and that the database server is running.
    - **Missing Environment Variables**: Ensure all required environment variables are set in your `.env.local` file.
    - **Stripe API Version Mismatch**: Make sure the Stripe API version in your code matches the one in your Stripe Dashboard.
    - **CORS Issues**: If you're testing locally, make sure your CORS settings allow requests from your local domain.
    - **Stripe Environment Variables Missing**: If Stripe environment variables are missing, the webhook will not work. In this case, use the `src/scripts/add-contribution-for-session.js` script to manually add contributions for specific Stripe sessions.
    - **Webhook Not Triggered**: If the webhook is not being triggered, check the Stripe Dashboard for any failed webhook events. You can also use the `src/scripts/add-contribution-for-session.js` script to manually add contributions for specific Stripe sessions.

## Design System

FoundFund uses a minimalist black and white design with green accents:

- Primary background: Black
- Secondary background: Dark gray
- Text: White
- Accents: Green (#22c55e)
- Cards: Dark backgrounds with white glowing shadows
- Buttons: White with glowing shadows

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org)
- [MongoDB](https://www.mongodb.com)
- [Stripe](https://stripe.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
