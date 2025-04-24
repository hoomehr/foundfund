require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Import mock data directly
const users = [
  {
    id: 'user1',
    username: 'johndoe',
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Entrepreneur and tech enthusiast with a passion for sustainable products.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-04-20T00:00:00Z',
    totalCreated: 3,
    totalFunded: 1,
    totalRaised: 8000,
    totalContributed: 200,
  },
  {
    id: 'user2',
    username: 'janesmith',
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: 'Investor and art collector looking for innovative projects to support.',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop',
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-04-18T00:00:00Z',
    totalCreated: 0,
    totalFunded: 2,
    totalRaised: 0,
    totalContributed: 250,
  },
  {
    id: 'user3',
    username: 'bobjohnson',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    bio: 'Artisan and craftsman specializing in handmade goods and culinary creations.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop',
    createdAt: '2023-01-20T00:00:00Z',
    updatedAt: '2023-04-15T00:00:00Z',
    totalCreated: 2,
    totalFunded: 1,
    totalRaised: 3200,
    totalContributed: 50,
  },
];

const fundItems = [
  {
    id: 'fund1',
    name: 'Eco-Friendly Water Bottle',
    description: 'A reusable water bottle made from recycled materials that keeps your drinks cold for 24 hours.',
    category: 'technology',
    fundingGoal: 5000,
    currentAmount: 3200,
    status: 'active',
    createdAt: '2023-04-01T00:00:00Z',
    endDate: '2023-06-01T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    creatorId: 'user1',
    featured: true,
  },
  {
    id: 'fund2',
    name: 'Handcrafted Ceramic Mugs',
    description: 'Unique, handmade ceramic mugs with custom designs. Each piece is one of a kind.',
    category: 'art',
    fundingGoal: 2000,
    currentAmount: 2000,
    status: 'funded',
    createdAt: '2023-03-15T00:00:00Z',
    endDate: '2023-05-15T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
    creatorId: 'user3',
    featured: true,
  },
  {
    id: 'fund3',
    name: 'Smart Home Garden Kit',
    description: 'An automated indoor garden system that lets you grow herbs and vegetables year-round.',
    category: 'technology',
    fundingGoal: 10000,
    currentAmount: 4500,
    status: 'active',
    createdAt: '2023-04-10T00:00:00Z',
    endDate: '2023-07-10T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
    creatorId: 'user1',
  },
  {
    id: 'fund4',
    name: 'Artisanal Chocolate Collection',
    description: 'A curated box of handcrafted chocolates made with ethically sourced ingredients.',
    category: 'food',
    fundingGoal: 3000,
    currentAmount: 1200,
    status: 'active',
    createdAt: '2023-04-05T00:00:00Z',
    endDate: '2023-06-05T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b',
    creatorId: 'user3',
  },
  {
    id: 'fund5',
    name: 'Minimalist Desk Organizer',
    description: 'A sleek, modular desk organizer that helps keep your workspace tidy and efficient.',
    category: 'other',
    fundingGoal: 1500,
    currentAmount: 300,
    status: 'active',
    createdAt: '2023-04-15T00:00:00Z',
    endDate: '2023-06-15T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8',
    creatorId: 'user1',
  },
];

const contributions = [
  {
    id: 'contrib1',
    fundItemId: 'fund1',
    userId: 'user2',
    campaignId: 'fund1',
    contributorId: 'user2',
    amount: 100,
    status: 'completed',
    message: "Love this eco-friendly initiative!",
    anonymous: false,
    createdAt: '2023-04-10T00:00:00Z',
  },
  {
    id: 'contrib2',
    fundItemId: 'fund1',
    userId: 'user3',
    campaignId: 'fund1',
    contributorId: 'user3',
    amount: 50,
    status: 'completed',
    anonymous: true,
    createdAt: '2023-04-12T00:00:00Z',
  },
  {
    id: 'contrib3',
    fundItemId: 'fund2',
    userId: 'user1',
    campaignId: 'fund2',
    contributorId: 'user1',
    amount: 200,
    status: 'completed',
    message: "These mugs look beautiful! Can't wait to receive mine.",
    anonymous: false,
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'contrib4',
    fundItemId: 'fund3',
    userId: 'user2',
    campaignId: 'fund3',
    contributorId: 'user2',
    amount: 150,
    status: 'completed',
    message: "This is exactly what I need for my apartment!",
    anonymous: false,
    createdAt: '2023-04-15T00:00:00Z',
  },
];

const userFollows = [
  {
    id: 'follow1',
    followerId: 'user2',
    followedId: 'user1',
    createdAt: '2023-03-15T00:00:00Z',
  },
  {
    id: 'follow2',
    followerId: 'user3',
    followedId: 'user1',
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'follow3',
    followerId: 'user1',
    followedId: 'user3',
    createdAt: '2023-04-05T00:00:00Z',
  },
];

const campaignBookmarks = [
  {
    id: 'bookmark1',
    userId: 'user1',
    campaignId: 'fund2',
    createdAt: '2023-03-16T00:00:00Z',
  },
  {
    id: 'bookmark2',
    userId: 'user2',
    campaignId: 'fund1',
    createdAt: '2023-04-02T00:00:00Z',
  },
  {
    id: 'bookmark3',
    userId: 'user2',
    campaignId: 'fund3',
    createdAt: '2023-04-11T00:00:00Z',
  },
];

const notifications = [
  {
    id: 'notif1',
    userId: 'user1',
    type: 'contribution',
    message: "Jane Smith contributed $100 to your Eco-Friendly Water Bottle campaign",
    read: false,
    relatedId: 'contrib1',
    createdAt: '2023-04-10T00:00:00Z',
  },
  {
    id: 'notif2',
    userId: 'user1',
    type: 'contribution',
    message: "Someone contributed $50 to your Eco-Friendly Water Bottle campaign",
    read: true,
    relatedId: 'contrib2',
    createdAt: '2023-04-12T00:00:00Z',
  },
  {
    id: 'notif3',
    userId: 'user3',
    type: 'contribution',
    message: "John Doe contributed $200 to your Handcrafted Ceramic Mugs campaign",
    read: false,
    relatedId: 'contrib3',
    createdAt: '2023-03-20T00:00:00Z',
  },
];

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
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    // Clear existing collections
    console.log('Clearing existing collections...');
    await db.collection('users').deleteMany({});
    await db.collection('funditems').deleteMany({});
    await db.collection('contributions').deleteMany({});
    await db.collection('userfollows').deleteMany({});
    await db.collection('campaignbookmarks').deleteMany({});
    await db.collection('notifications').deleteMany({});

    // We're using the directly defined mock data variables

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
