import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define a simple test
describe('Combined Database Test', () => {
  let db;
  
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
  });
  
  // Disconnect from the database after all tests
  afterAll(async () => {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  });
  
  // Test the complete flow in a single test
  test('should handle the complete flow: create user, campaign, and contribution', async () => {
    // Create schemas
    const userSchema = new mongoose.Schema({
      username: String,
      email: String
    });
    
    const campaignSchema = new mongoose.Schema({
      name: String,
      description: String,
      fundingGoal: Number,
      currentAmount: { type: Number, default: 0 },
      creatorId: String
    });
    
    const contributionSchema = new mongoose.Schema({
      userId: String,
      campaignId: String,
      amount: Number
    });
    
    // Create models
    const User = mongoose.models.TestUser || mongoose.model('TestUser', userSchema);
    const Campaign = mongoose.models.TestCampaign || mongoose.model('TestCampaign', campaignSchema);
    const Contribution = mongoose.models.TestContribution || mongoose.model('TestContribution', contributionSchema);
    
    // 1. Create a user
    const user = await User.create({
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@example.com`
    });
    
    expect(user).toBeDefined();
    expect(user.username).toContain('testuser-');
    console.log(`Created user with ID: ${user._id}`);
    
    // 2. Create a campaign
    const campaign = await Campaign.create({
      name: 'Test Campaign',
      description: 'Test Description',
      fundingGoal: 1000,
      currentAmount: 0,
      creatorId: user._id.toString()
    });
    
    expect(campaign).toBeDefined();
    expect(campaign.name).toBe('Test Campaign');
    expect(campaign.creatorId).toBe(user._id.toString());
    console.log(`Created campaign with ID: ${campaign._id}`);
    
    // Verify the campaign exists in the database
    const savedCampaign = await Campaign.findById(campaign._id);
    expect(savedCampaign).toBeDefined();
    expect(savedCampaign.name).toBe('Test Campaign');
    console.log(`Verified campaign exists in database with ID: ${savedCampaign._id}`);
    
    // 3. Create a contribution
    const contribution = await Contribution.create({
      userId: user._id.toString(),
      campaignId: campaign._id.toString(),
      amount: 100
    });
    
    expect(contribution).toBeDefined();
    expect(contribution.amount).toBe(100);
    expect(contribution.userId).toBe(user._id.toString());
    expect(contribution.campaignId).toBe(campaign._id.toString());
    console.log(`Created contribution with ID: ${contribution._id}`);
    
    // 4. Update the campaign amount
    await Campaign.updateOne(
      { _id: campaign._id },
      { $inc: { currentAmount: contribution.amount } }
    );
    
    // 5. Verify the campaign was updated
    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign).toBeDefined();
    expect(updatedCampaign.currentAmount).toBe(100);
    console.log(`Updated campaign current amount to: ${updatedCampaign.currentAmount}`);
    
    // 6. Clean up
    await User.deleteOne({ _id: user._id });
    await Campaign.deleteOne({ _id: campaign._id });
    await Contribution.deleteOne({ _id: contribution._id });
    console.log('Cleaned up test data');
  });
});
