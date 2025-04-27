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
   - It creates a contribution record in the database using the `/api/contributions/direct` endpoint.
   - It displays a success message with campaign details.

4. **Webhook Processing**:
   - Stripe also sends a webhook event to `/api/stripe/webhook` when the payment is completed.
   - The webhook handler creates a contribution record if one doesn't exist yet.
   - It updates the campaign's funding stats (current amount, contributions count, unique contributors).

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
