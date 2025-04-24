import { FundItem, User, Contribution, Category, FundingStatus } from '@/types';

// Mock Users
export const users: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    isCreator: true,
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isCreator: false,
  },
  {
    id: 'user3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    isCreator: true,
  },
];

// Mock Fund Items
export const fundItems: FundItem[] = [
  {
    id: 'fund1',
    name: 'Eco-Friendly Water Bottle',
    description: 'A reusable water bottle made from recycled materials that keeps your drinks cold for 24 hours.',
    creatorId: 'user1',
    category: 'technology',
    fundingGoal: 5000,
    currentAmount: 3200,
    status: 'active',
    createdAt: '2023-04-01T00:00:00Z',
    endDate: '2023-06-01T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
  },
  {
    id: 'fund2',
    name: 'Handcrafted Ceramic Mugs',
    description: 'Unique, handmade ceramic mugs with custom designs. Each piece is one of a kind.',
    creatorId: 'user3',
    category: 'art',
    fundingGoal: 2000,
    currentAmount: 2000,
    status: 'funded',
    createdAt: '2023-03-15T00:00:00Z',
    endDate: '2023-05-15T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
  },
  {
    id: 'fund3',
    name: 'Smart Home Garden Kit',
    description: 'An automated indoor garden system that lets you grow herbs and vegetables year-round.',
    creatorId: 'user1',
    category: 'technology',
    fundingGoal: 10000,
    currentAmount: 4500,
    status: 'active',
    createdAt: '2023-04-10T00:00:00Z',
    endDate: '2023-07-10T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
  },
  {
    id: 'fund4',
    name: 'Artisanal Chocolate Collection',
    description: 'A curated box of handcrafted chocolates made with ethically sourced ingredients.',
    creatorId: 'user3',
    category: 'food',
    fundingGoal: 3000,
    currentAmount: 1200,
    status: 'active',
    createdAt: '2023-04-05T00:00:00Z',
    endDate: '2023-06-05T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b',
  },
  {
    id: 'fund5',
    name: 'Minimalist Desk Organizer',
    description: 'A sleek, modular desk organizer that helps keep your workspace tidy and efficient.',
    creatorId: 'user1',
    category: 'other',
    fundingGoal: 1500,
    currentAmount: 300,
    status: 'active',
    createdAt: '2023-04-15T00:00:00Z',
    endDate: '2023-06-15T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8',
  },
];

// Mock Contributions
export const contributions: Contribution[] = [
  {
    id: 'contrib1',
    fundItemId: 'fund1',
    userId: 'user2',
    amount: 100,
    createdAt: '2023-04-10T00:00:00Z',
  },
  {
    id: 'contrib2',
    fundItemId: 'fund1',
    userId: 'user3',
    amount: 50,
    createdAt: '2023-04-12T00:00:00Z',
  },
  {
    id: 'contrib3',
    fundItemId: 'fund2',
    userId: 'user1',
    amount: 200,
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'contrib4',
    fundItemId: 'fund3',
    userId: 'user2',
    amount: 150,
    createdAt: '2023-04-15T00:00:00Z',
  },
];

// Helper functions to work with mock data
export const getCurrentUser = () => users[0]; // For simplicity, we'll always use the first user

export const getFundItemsByCreator = (creatorId: string) => {
  return fundItems.filter(item => item.creatorId === creatorId);
};

export const getContributionsByFundItem = (fundItemId: string) => {
  return contributions.filter(contrib => contrib.fundItemId === fundItemId);
};

export const getCategories = (): Category[] => {
  return ['technology', 'art', 'food', 'fashion', 'games', 'other'];
};

export const getFundingStatuses = (): FundingStatus[] => {
  return ['active', 'funded', 'expired'];
};
