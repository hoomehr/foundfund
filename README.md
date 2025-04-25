# FoundFund

FoundFund is a modern micro-funding platform that connects creators with funders. Built with Next.js, TypeScript, and MongoDB, it provides a sleek, user-friendly interface for discovering, creating, and contributing to campaigns.

## Features

- **Discover Campaigns**: Browse through a curated list of campaigns with filtering options
- **Create Campaigns**: Easily create and manage your own funding campaigns
- **Contribute to Projects**: Support campaigns with secure contributions
- **User Dashboard**: Track your created campaigns and contributions
- **Analytics**: View detailed analytics about your campaigns and investments
- **Responsive Design**: Optimized for both desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
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
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

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
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── api/       # API routes
│   │   ├── foundfund/ # Main application routes
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts
│   ├── data/          # Mock data
│   ├── lib/           # Utility functions
│   ├── models/        # MongoDB models
│   ├── types/         # TypeScript type definitions
├── .env.local         # Environment variables
├── next.config.js     # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
```

## Key Pages

- `/foundfund/funders` - Discover page for browsing campaigns
- `/foundfund/creators` - Dashboard for creators to manage campaigns
- `/foundfund/investments` - Track your contributions to campaigns
- `/foundfund/projects/[id]` - Campaign details page
- `/foundfund/creators/new` - Create a new campaign
- `/foundfund/creators/edit/[id]` - Edit an existing campaign

## API Endpoints

- `GET /api/campaigns` - List all campaigns with optional filters
- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns/[id]` - Get a specific campaign
- `PATCH /api/campaigns/[id]` - Update a campaign
- `GET /api/contributions` - List contributions with optional filters
- `POST /api/contributions` - Create a new contribution
- `GET /api/users` - List users
- `POST /api/users` - Create a new user
- `POST /api/upload` - Upload images for campaigns

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
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
