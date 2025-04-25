import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define schemas directly to avoid issues with imports
const userSchema = new mongoose.Schema({
  id: String,
  username: String,
  email: String,
  password: String,
  name: String,
  bio: String,
  avatarUrl: String
});

const fundItemSchema = new mongoose.Schema({
  id: String,
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
  id: String,
  userId: String,
  campaignId: String,
  amount: Number,
  message: String,
  anonymous: Boolean,
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const FundItem = mongoose.models.FundItem || mongoose.model('FundItem', fundItemSchema);
const Contribution = mongoose.models.Contribution || mongoose.model('Contribution', contributionSchema);

// Test data
const testUser = {
  username: `testuser-${Date.now()}`,
  email: `test-${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User',
  bio: 'Test bio',
  avatarUrl: 'https://example.com/avatar.jpg'
};

const testCampaign = {
  name: 'Test Campaign',
  description: 'This is a test campaign created by the integration test',
  category: 'technology',
  fundingGoal: 1000,
  currentAmount: 0,
  imageUrl: '/uploads/test-image.jpg',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  tags: ['test', 'integration'],
  status: 'active'
};

const testContribution = {
  amount: 100,
  message: 'Good luck with your project!',
  anonymous: false
};

describe('Database Integration Tests', () => {
  let createdUser;
  let createdCampaign;

  // Connect to the database before all tests
  beforeAll(async () => {
    // Check if we have a MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    // Clean up created data
    if (createdUser) {
      await User.deleteOne({ _id: createdUser._id });
    }

    if (createdCampaign) {
      await FundItem.deleteOne({ _id: createdCampaign._id });
      // Also delete any contributions related to this campaign
      await Contribution.deleteMany({ campaignId: createdCampaign._id.toString() });
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  });

  // Test the complete flow in a single test to ensure sequential execution
  test('should handle the complete flow: create user, campaign, contribution, and retrieve data', async () => {
    // Step 1: Create a user
    createdUser = await User.create(testUser);

    // Verify the user was created
    expect(createdUser).toBeDefined();
    expect(createdUser.username).toBe(testUser.username);
    expect(createdUser.email).toBe(testUser.email);

    console.log(`Created user with ID: ${createdUser._id}`);

    // Step 2: Create a campaign
    createdCampaign = await FundItem.create({
      ...testCampaign,
      creatorId: createdUser._id.toString()
    });

    // Verify the campaign was created
    expect(createdCampaign).toBeDefined();
    expect(createdCampaign.name).toBe(testCampaign.name);
    expect(createdCampaign.creatorId).toBe(createdUser._id.toString());
    expect(createdCampaign.currentAmount).toBe(0);

    console.log(`Created campaign with ID: ${createdCampaign._id}`);

    // Step 3: Create a contribution
    const contribution = await Contribution.create({
      ...testContribution,
      userId: createdUser._id.toString(),
      campaignId: createdCampaign._id.toString()
    });

    // Verify the contribution was created
    expect(contribution).toBeDefined();
    expect(contribution.userId).toBe(createdUser._id.toString());
    expect(contribution.campaignId).toBe(createdCampaign._id.toString());
    expect(contribution.amount).toBe(testContribution.amount);

    console.log(`Created contribution with ID: ${contribution._id}`);

    // Step 4: Update the campaign's current amount
    await FundItem.updateOne(
      { _id: createdCampaign._id },
      { $inc: { currentAmount: contribution.amount } }
    );

    // Step 5: Verify the campaign's current amount was updated
    const updatedCampaign = await FundItem.findById(createdCampaign._id);
    expect(updatedCampaign).toBeDefined();
    expect(updatedCampaign.currentAmount).toBe(testContribution.amount);

    console.log(`Updated campaign current amount to: ${updatedCampaign.currentAmount}`);

    // Step 6: Retrieve the campaign again to verify persistence
    const retrievedCampaign = await FundItem.findById(createdCampaign._id);

    // Verify the campaign was retrieved
    expect(retrievedCampaign).toBeDefined();
    expect(retrievedCampaign._id.toString()).toBe(createdCampaign._id.toString());
    expect(retrievedCampaign.currentAmount).toBe(testContribution.amount);

    // Step 7: Retrieve the contributions for the campaign
    const contributions = await Contribution.find({ campaignId: createdCampaign._id.toString() });

    // Verify the contributions were retrieved
    expect(contributions).toBeDefined();
    expect(contributions.length).toBe(1);
    expect(contributions[0].userId).toBe(createdUser._id.toString());
    expect(contributions[0].amount).toBe(testContribution.amount);

    console.log(`Retrieved ${contributions.length} contributions for campaign ${createdCampaign._id}`);
  });
});
