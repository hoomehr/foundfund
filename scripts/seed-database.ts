import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import {
  users,
  fundItems,
  contributions,
  userFollows,
  campaignBookmarks,
  notifications
} from '../src/data/mockData';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined (value hidden)' : 'Undefined');
console.log('MONGODB_DB:', process.env.MONGODB_DB);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

async function seedDatabase() {
  console.log('Connecting to MongoDB...');
  // We've already checked that uri is defined, so we can assert it as string
  const client = new MongoClient(uri as string);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName as string);

    // Clear existing collections
    console.log('Clearing existing collections...');
    await db.collection('users').deleteMany({});
    await db.collection('funditems').deleteMany({});
    await db.collection('contributions').deleteMany({});
    await db.collection('userfollows').deleteMany({});
    await db.collection('campaignbookmarks').deleteMany({});
    await db.collection('notifications').deleteMany({});

    // Insert mock data
    console.log('Inserting users...');
    await db.collection('users').insertMany(users);

    console.log('Inserting fund items...');
    await db.collection('funditems').insertMany(fundItems);

    console.log('Inserting contributions...');
    await db.collection('contributions').insertMany(contributions);

    console.log('Inserting user follows...');
    await db.collection('userfollows').insertMany(userFollows);

    console.log('Inserting campaign bookmarks...');
    await db.collection('campaignbookmarks').insertMany(campaignBookmarks);

    console.log('Inserting notifications...');
    await db.collection('notifications').insertMany(notifications);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedDatabase();
