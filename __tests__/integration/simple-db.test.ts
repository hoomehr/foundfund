import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define a simple test
describe('MongoDB Connection Test', () => {
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
  
  // Test the connection
  test('should connect to MongoDB', () => {
    expect(db.readyState).toBe(1); // 1 = connected
  });
  
  // Test creating and retrieving a document
  test('should create and retrieve a document', async () => {
    // Create a simple schema
    const testSchema = new mongoose.Schema({
      name: String,
      value: Number,
      createdAt: { type: Date, default: Date.now }
    });
    
    // Create a model
    const TestModel = mongoose.models.Test || mongoose.model('Test', testSchema);
    
    // Create a document
    const testDoc = await TestModel.create({
      name: 'Test Document',
      value: 42
    });
    
    // Verify the document was created
    expect(testDoc).toBeDefined();
    expect(testDoc.name).toBe('Test Document');
    expect(testDoc.value).toBe(42);
    
    // Retrieve the document
    const retrievedDoc = await TestModel.findById(testDoc._id);
    
    // Verify the document was retrieved
    expect(retrievedDoc).toBeDefined();
    expect(retrievedDoc.name).toBe('Test Document');
    expect(retrievedDoc.value).toBe(42);
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
  });
  
  // Test the complete flow: create user, campaign, and contribution
  test('should handle the complete flow', async () => {
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
      username: 'testuser',
      email: 'test@example.com'
    });
    
    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
    
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
    
    // 3. Create a contribution
    const contribution = await Contribution.create({
      userId: user._id.toString(),
      campaignId: campaign._id.toString(),
      amount: 100
    });
    
    expect(contribution).toBeDefined();
    expect(contribution.amount).toBe(100);
    
    // 4. Update the campaign amount
    await Campaign.updateOne(
      { _id: campaign._id },
      { $inc: { currentAmount: contribution.amount } }
    );
    
    // 5. Verify the campaign was updated
    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign).toBeDefined();
    expect(updatedCampaign.currentAmount).toBe(100);
    
    // 6. Clean up
    await User.deleteOne({ _id: user._id });
    await Campaign.deleteOne({ _id: campaign._id });
    await Contribution.deleteOne({ _id: contribution._id });
  });
});
