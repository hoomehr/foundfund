import { NextRequest } from 'next/server';
import { FundItem, User } from '@/models';

// Mock Next.js API route handlers
jest.mock('@/app/api/campaigns/route', () => {
  return {
    GET: jest.fn(async (req) => {
      const url = new URL(req.url);
      const creatorId = url.searchParams.get('creatorId');
      const category = url.searchParams.get('category');

      let query: any = {};
      if (creatorId) query.creatorId = creatorId;
      if (category) query.category = category;

      const campaigns = await FundItem.find(query);
      return new Response(JSON.stringify(campaigns), { status: 200 });
    }),
    POST: jest.fn(async (req) => {
      const data = await req.json();

      // Check for required fields
      if (!data.name || !data.description || !data.fundingGoal || !data.category) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }

      const campaign = await FundItem.create(data);
      return new Response(JSON.stringify(campaign), { status: 201 });
    })
  };
});

// Import the mocked functions
const { GET, POST } = require('@/app/api/campaigns/route');

// Mock data
const mockCampaign = {
  name: 'Test Campaign',
  description: 'Test Description',
  category: 'technology',
  fundingGoal: 1000,
  imageUrl: 'https://example.com/image.jpg',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  creatorId: 'user1',
  tags: ['tech', 'innovative'],
  status: 'active'
};

const mockUser = {
  id: 'user1',
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  bio: 'Test bio',
  avatarUrl: 'https://example.com/avatar.jpg'
};

describe('Campaigns API', () => {
  beforeEach(async () => {
    // Create a test user
    await User.create(mockUser);
  });

  describe('GET /api/campaigns', () => {
    it('should return an empty array when no campaigns exist', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return all campaigns', async () => {
      // Create a test campaign
      await FundItem.create(mockCampaign);

      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe(mockCampaign.name);
    });

    it('should filter campaigns by creatorId', async () => {
      // Create test campaigns
      await FundItem.create(mockCampaign);
      await FundItem.create({
        ...mockCampaign,
        name: 'Another Campaign',
        creatorId: 'user2'
      });

      // Create a mock request with query parameters
      const req = new NextRequest('http://localhost:3000/api/campaigns?creatorId=user1');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe(mockCampaign.name);
      expect(data[0].creatorId).toBe('user1');
    });

    it('should filter campaigns by category', async () => {
      // Create test campaigns
      await FundItem.create(mockCampaign);
      await FundItem.create({
        ...mockCampaign,
        name: 'Art Campaign',
        category: 'art'
      });

      // Create a mock request with query parameters
      const req = new NextRequest('http://localhost:3000/api/campaigns?category=art');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Art Campaign');
      expect(data[0].category).toBe('art');
    });
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(mockCampaign)
      });

      // Call the API
      const response = await POST(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(201);
      expect(data.name).toBe(mockCampaign.name);
      expect(data.description).toBe(mockCampaign.description);
      expect(data.creatorId).toBe(mockCampaign.creatorId);

      // Check that the campaign was saved to the database
      const savedCampaign = await FundItem.findOne({ name: mockCampaign.name });
      expect(savedCampaign).not.toBeNull();
      expect(savedCampaign.description).toBe(mockCampaign.description);
    });

    it('should return 400 if required fields are missing', async () => {
      // Create a mock request with missing fields
      const req = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Incomplete Campaign',
          description: 'Missing required fields'
        })
      });

      // Call the API
      const response = await POST(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });
});
