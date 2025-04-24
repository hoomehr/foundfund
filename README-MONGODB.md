# FoundFund MongoDB Integration

This document provides instructions for setting up and using MongoDB with the FoundFund application.

## Prerequisites

- MongoDB Atlas account or a local MongoDB server
- Node.js and npm installed

## Setup Instructions

### 1. Set Up MongoDB

#### Option A: MongoDB Atlas (Recommended for Production)

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database access (create a user with password)
4. Set up network access (allow access from your IP or from anywhere for development)
5. Get your connection string from the "Connect" button

#### Option B: Local MongoDB Server (for Development)

1. Install MongoDB Community Edition: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start the MongoDB server
3. Use the connection string: `mongodb://localhost:27017/foundfund`

### 2. Configure Environment Variables

1. Create or update the `.env.local` file in the root of your project:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=foundfund
```

Replace `your_mongodb_connection_string` with your actual MongoDB connection string.

### 3. Seed the Database

Run the following command to seed the database with initial data:

```bash
npm run seed
```

This will populate your MongoDB database with the mock data from the application.

## API Routes

The application includes the following API routes for accessing data:

- `/api/users` - Get all users
- `/api/users/[id]` - Get a specific user
- `/api/campaigns` - Get all campaigns (with optional filtering)
- `/api/campaigns/[id]` - Get a specific campaign
- `/api/contributions` - Get all contributions (with optional filtering)

## Data Models

The application uses the following data models:

- **User**: User profiles with statistics
- **FundItem/Campaign**: Funding campaigns with details
- **Contribution**: Funding contributions
- **UserFollow**: User follow relationships
- **CampaignBookmark**: Bookmarked campaigns
- **Notification**: User notifications

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Check that your MongoDB server is running
2. Verify your connection string in `.env.local`
3. Check network access settings in MongoDB Atlas
4. Check database user credentials

### Seeding Issues

If you encounter issues with seeding:

1. Make sure your MongoDB connection is working
2. Check the console for specific error messages
3. Try running the seed script with Node directly: `npx ts-node scripts/seed-database.ts`

## Development Workflow

1. Start the development server: `npm run dev`
2. The application will connect to MongoDB using the connection string in `.env.local`
3. API routes will fetch data from MongoDB
4. Changes to the database will be reflected in the application

## Production Deployment

For production deployment:

1. Set up a MongoDB Atlas cluster
2. Configure environment variables in your hosting platform
3. Build and deploy the application
