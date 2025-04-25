import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/contributions/route';
import { Contribution, FundItem, User } from '@/models';

// Mock data
const mockUser = {
  id: 'user1',
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  bio: 'Test bio',
  avatarUrl: 'https://example.com/avatar.jpg'
};

const mockCampaign = {
  id: 'campaign1',
  name: 'Test Campaign',
  description: 'Test Description',
  category: 'technology',
  fundingGoal: 1000,
  imageUrl: 'https://example.com/image.jpg',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  creatorId: 'user1',
  tags: ['tech', 'innovative'],
  status: 'active',
  currentAmount: 0
};

const mockContribution = {
  userId: 'user1',
  campaignId: 'campaign1',
  amount: 100,
  message: 'Good luck with your project!',
  anonymous: false
};

describe('Contributions API', () => {
  beforeEach(async () => {
    // Create test user and campaign
    await User.create(mockUser);
    await FundItem.create(mockCampaign);
  });

  describe('GET /api/contributions', () => {
    it('should return an empty array when no contributions exist', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/contributions');
      
      // Call the API
      const response = await GET(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return all contributions', async () => {
      // Create a test contribution
      await Contribution.create(mockContribution);
      
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/contributions');
      
      // Call the API
      const response = await GET(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].userId).toBe(mockContribution.userId);
      expect(data[0].campaignId).toBe(mockContribution.campaignId);
      expect(data[0].amount).toBe(mockContribution.amount);
    });

    it('should filter contributions by userId', async () => {
      // Create test contributions
      await Contribution.create(mockContribution);
      await Contribution.create({
        ...mockContribution,
        userId: 'user2',
        amount: 200
      });
      
      // Create a mock request with query parameters
      const req = new NextRequest('http://localhost:3000/api/contributions?userId=user1');
      
      // Call the API
      const response = await GET(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].userId).toBe('user1');
      expect(data[0].amount).toBe(100);
    });

    it('should filter contributions by campaignId', async () => {
      // Create test contributions
      await Contribution.create(mockContribution);
      await Contribution.create({
        ...mockContribution,
        campaignId: 'campaign2',
        amount: 200
      });
      
      // Create a mock request with query parameters
      const req = new NextRequest('http://localhost:3000/api/contributions?campaignId=campaign1');
      
      // Call the API
      const response = await GET(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].campaignId).toBe('campaign1');
      expect(data[0].amount).toBe(100);
    });
  });

  describe('POST /api/contributions', () => {
    it('should create a new contribution and update campaign amount', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(mockContribution)
      });
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(201);
      expect(data.userId).toBe(mockContribution.userId);
      expect(data.campaignId).toBe(mockContribution.campaignId);
      expect(data.amount).toBe(mockContribution.amount);
      
      // Check that the contribution was saved to the database
      const savedContribution = await Contribution.findOne({ 
        userId: mockContribution.userId,
        campaignId: mockContribution.campaignId
      });
      expect(savedContribution).not.toBeNull();
      expect(savedContribution.amount).toBe(mockContribution.amount);
      
      // Check that the campaign amount was updated
      const updatedCampaign = await FundItem.findOne({ id: mockCampaign.id });
      expect(updatedCampaign.currentAmount).toBe(mockContribution.amount);
    });

    it('should return 400 if required fields are missing', async () => {
      // Create a mock request with missing fields
      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          // Missing campaignId and amount
          message: 'Incomplete contribution'
        })
      });
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 404 if campaign is not found', async () => {
      // Create a mock request with non-existent campaign
      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify({
          ...mockContribution,
          campaignId: 'nonexistent'
        })
      });
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data.error).toBe('Campaign not found');
    });
  });
});
