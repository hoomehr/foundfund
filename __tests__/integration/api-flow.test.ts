import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NextRequest, NextResponse } from 'next/server';

// Load environment variables
dotenv.config();

// Define schemas
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  name: String,
  bio: String,
  avatarUrl: String
});

const campaignSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  fundingGoal: Number,
  currentAmount: { type: Number, default: 0 },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  endDate: Date,
  creatorId: String,
  tags: [String],
  status: { type: String, default: 'active' }
});

const contributionSchema = new mongoose.Schema({
  userId: String,
  campaignId: String,
  amount: Number,
  message: String,
  anonymous: Boolean,
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.models.TestUser || mongoose.model('TestUser', userSchema);
const Campaign = mongoose.models.TestCampaign || mongoose.model('TestCampaign', campaignSchema);
const Contribution = mongoose.models.TestContribution || mongoose.model('TestContribution', contributionSchema);

// Mock the API handlers
const mockCreateCampaign = async (req: NextRequest) => {
  try {
    const data = await req.json();

    // Check for required fields
    if (!data.name || !data.description || !data.fundingGoal || !data.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the campaign
    const campaign = await Campaign.create({
      ...data,
      currentAmount: 0
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
};

const mockCreateContribution = async (req: NextRequest) => {
  try {
    const data = await req.json();

    // Check for required fields
    if (!data.userId || !data.campaignId || !data.amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the campaign exists
    console.log(`Looking for campaign with ID: ${data.campaignId}`);
    const campaign = await Campaign.findById(data.campaignId);
    if (!campaign) {
      console.log(`Campaign not found with ID: ${data.campaignId}`);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    console.log(`Found campaign: ${campaign.name}`);


    // Create the contribution
    const contribution = await Contribution.create(data);

    // Update the campaign's current amount
    await Campaign.updateOne(
      { _id: data.campaignId },
      { $inc: { currentAmount: data.amount } }
    );

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
  }
};

// Test suite
describe('API Flow Integration Test', () => {
  let db;
  let testUser;
  let testCampaign;

  // Connect to the database before all tests
  beforeAll(async () => {
    // Check if we have a MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    db = mongoose.connection;
    console.log('Connected to MongoDB');

    // Create a test user
    testUser = await User.create({
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      bio: 'Test bio',
      avatarUrl: 'https://example.com/avatar.jpg'
    });
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    // Clean up
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }

    if (testCampaign) {
      await Campaign.deleteOne({ _id: testCampaign._id });
      await Contribution.deleteMany({ campaignId: testCampaign._id.toString() });
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  });

  // Test the complete flow in a single test to ensure sequential execution
  test('should handle the complete flow: create campaign and make contribution', async () => {
    // Step 1: Create a campaign
    const campaignReq = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Campaign',
        description: 'This is a test campaign',
        category: 'technology',
        fundingGoal: 1000,
        imageUrl: '/uploads/test-image.jpg',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        creatorId: testUser._id.toString(),
        tags: ['test', 'integration']
      })
    });

    // Call the mock API
    const campaignResponse = await mockCreateCampaign(campaignReq);
    const campaignData = await campaignResponse.json();

    // Check the response
    expect(campaignResponse.status).toBe(201);
    expect(campaignData.name).toBe('Test Campaign');
    expect(campaignData.creatorId).toBe(testUser._id.toString());

    // Save the campaign for later tests
    testCampaign = campaignData;
    console.log(`Created campaign with ID: ${testCampaign._id}`);

    // Verify the campaign exists in the database
    const savedCampaign = await Campaign.findById(testCampaign._id);
    expect(savedCampaign).toBeDefined();
    console.log(`Verified campaign exists in database with ID: ${savedCampaign._id}`);

    // Step 2: Make a contribution
    // Modify the mockCreateContribution function to use the correct ID field
    const mockContributionHandler = async (req) => {
      try {
        const data = await req.json();

        // Check for required fields
        if (!data.userId || !data.campaignId || !data.amount) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if the campaign exists using the _id field
        console.log(`Looking for campaign with ID: ${data.campaignId}`);
        const campaign = await Campaign.findById(data.campaignId);
        if (!campaign) {
          console.log(`Campaign not found with ID: ${data.campaignId}`);
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        console.log(`Found campaign: ${campaign.name}`);

        // Create the contribution
        const contribution = await Contribution.create(data);

        // Update the campaign's current amount
        await Campaign.updateOne(
          { _id: data.campaignId },
          { $inc: { currentAmount: data.amount } }
        );

        return NextResponse.json(contribution, { status: 201 });
      } catch (error) {
        console.error('Error creating contribution:', error);
        return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
      }
    };

    // Create a mock request
    const contributionReq = new NextRequest('http://localhost:3000/api/contributions', {
      method: 'POST',
      body: JSON.stringify({
        userId: testUser._id.toString(),
        campaignId: testCampaign._id.toString(),
        amount: 100,
        message: 'Good luck with your project!',
        anonymous: false
      })
    });

    // Call the mock API with our custom handler
    const contributionResponse = await mockContributionHandler(contributionReq);
    const contributionData = await contributionResponse.json();

    // Check the response
    expect(contributionResponse.status).toBe(201);
    expect(contributionData.userId).toBe(testUser._id.toString());
    expect(contributionData.campaignId).toBe(testCampaign._id.toString());
    expect(contributionData.amount).toBe(100);

    console.log(`Created contribution with ID: ${contributionData._id}`);

    // Verify the campaign's current amount was updated
    const updatedCampaign = await Campaign.findById(testCampaign._id);
    expect(updatedCampaign).toBeDefined();
    expect(updatedCampaign.currentAmount).toBe(100);

    console.log(`Updated campaign current amount to: ${updatedCampaign.currentAmount}`);
  });

  // Test error handling for missing fields
  test('should return 400 if required fields are missing', async () => {
    // Create a mock request with missing fields
    const req = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Incomplete Campaign',
        // Missing description, fundingGoal, and category
      })
    });

    // Call the mock API
    const response = await mockCreateCampaign(req);
    const data = await response.json();

    // Check the response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  // Test error handling for non-existent campaign
  test('should return 404 if campaign is not found', async () => {
    // Create a mock request with non-existent campaign
    const req = new NextRequest('http://localhost:3000/api/contributions', {
      method: 'POST',
      body: JSON.stringify({
        userId: testUser._id.toString(),
        campaignId: new mongoose.Types.ObjectId().toString(), // Random ID
        amount: 100
      })
    });

    // Get access to the mockContributionHandler from the previous test
    const mockContributionHandler = async (req) => {
      try {
        const data = await req.json();

        // Check for required fields
        if (!data.userId || !data.campaignId || !data.amount) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if the campaign exists using the _id field
        console.log(`Looking for campaign with ID: ${data.campaignId}`);
        const campaign = await Campaign.findById(data.campaignId);
        if (!campaign) {
          console.log(`Campaign not found with ID: ${data.campaignId}`);
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        console.log(`Found campaign: ${campaign.name}`);

        // Create the contribution
        const contribution = await Contribution.create(data);

        // Update the campaign's current amount
        await Campaign.updateOne(
          { _id: data.campaignId },
          { $inc: { currentAmount: data.amount } }
        );

        return NextResponse.json(contribution, { status: 201 });
      } catch (error) {
        console.error('Error creating contribution:', error);
        return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
      }
    };

    // Call the mock API with our custom handler
    const response = await mockContributionHandler(req);
    const data = await response.json();

    // Check the response
    expect(response.status).toBe(404);
    expect(data.error).toBe('Campaign not found');
  });
});
