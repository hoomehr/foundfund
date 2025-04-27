// This script tests the MongoDB connection and performs basic CRUD operations
// Run with: node src/scripts/debug-mongodb-connection.js

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
async function testMongoDBConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Database name: ${dbName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Test read operation - Count documents in each collection
    console.log('\nCounting documents in each collection:');
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
    // Test write operation - Create a test document in a test collection
    const testId = uuidv4();
    const testDocument = {
      _id: new mongoose.Types.ObjectId(),
      id: testId,
      name: 'Test Document',
      createdAt: new Date()
    };
    
    console.log('\nCreating test document...');
    const result = await mongoose.connection.db.collection('test_debug').insertOne(testDocument);
    console.log(`Test document created with ID: ${result.insertedId}`);
    
    // Test read operation - Find the test document
    console.log('\nFinding test document...');
    const foundDocument = await mongoose.connection.db.collection('test_debug').findOne({ id: testId });
    console.log('Found test document:', foundDocument);
    
    // Test update operation - Update the test document
    console.log('\nUpdating test document...');
    const updateResult = await mongoose.connection.db.collection('test_debug').updateOne(
      { id: testId },
      { $set: { updated: true, updatedAt: new Date() } }
    );
    console.log(`Test document updated: ${updateResult.modifiedCount} document modified`);
    
    // Test read operation - Find the updated test document
    console.log('\nFinding updated test document...');
    const updatedDocument = await mongoose.connection.db.collection('test_debug').findOne({ id: testId });
    console.log('Found updated test document:', updatedDocument);
    
    // Test delete operation - Delete the test document
    console.log('\nDeleting test document...');
    const deleteResult = await mongoose.connection.db.collection('test_debug').deleteOne({ id: testId });
    console.log(`Test document deleted: ${deleteResult.deletedCount} document deleted`);
    
    console.log('\nMongoDB connection test completed successfully');
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
testMongoDBConnection();
