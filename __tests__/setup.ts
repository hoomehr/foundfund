import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Declare the mongoServer variable in the global scope
let mongoServer: MongoMemoryServer;

// Mock the models to avoid issues with imports
jest.mock('@/models', () => {
  const mongoose = require('mongoose');

  // Define schemas
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
    fundItemId: String,
    amount: Number,
    message: String,
    anonymous: Boolean,
    createdAt: { type: Date, default: Date.now }
  });

  // Mock the connectToDatabase function
  const connectToDatabase = async () => {
    console.log('Mock connectToDatabase called');
    return mongoose.connection;
  };

  // Create and export models
  return {
    User: mongoose.models.User || mongoose.model('User', userSchema),
    FundItem: mongoose.models.FundItem || mongoose.model('FundItem', fundItemSchema),
    Contribution: mongoose.models.Contribution || mongoose.model('Contribution', contributionSchema),
    connectToDatabase
  };
});

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set the MongoDB URI environment variable
  process.env.MONGODB_URI = uri;

  // Connect to the in-memory database
  await mongoose.connect(uri);

  console.log('Connected to in-memory MongoDB server');
});

// Clean up after all tests
afterAll(async () => {
  // Disconnect from the database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Stop the in-memory server
  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log('Disconnected from in-memory MongoDB server');
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
