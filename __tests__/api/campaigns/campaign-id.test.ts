import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/campaigns/[id]/route';
import { FundItem } from '@/models';

// Mock data
const mockCampaign = {
  id: 'campaign-test123',
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

describe('Campaign by ID API', () => {
  beforeEach(async () => {
    // Create a test campaign
    await FundItem.create(mockCampaign);
  });

  describe('GET /api/campaigns/[id]', () => {
    it('should return a campaign by ID', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns/campaign-test123');
      
      // Call the API
      const response = await GET(req, { params: { id: 'campaign-test123' } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data.id).toBe(mockCampaign.id);
      expect(data.name).toBe(mockCampaign.name);
      expect(data.description).toBe(mockCampaign.description);
    });

    it('should return 404 if campaign is not found', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns/nonexistent');
      
      // Call the API
      const response = await GET(req, { params: { id: 'nonexistent' } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data.error).toBe('Campaign not found');
    });
  });

  describe('PATCH /api/campaigns/[id]', () => {
    it('should update a campaign', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns/campaign-test123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Campaign Name',
          description: 'Updated Description'
        })
      });
      
      // Call the API
      const response = await PATCH(req, { params: { id: 'campaign-test123' } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data.id).toBe(mockCampaign.id);
      expect(data.name).toBe('Updated Campaign Name');
      expect(data.description).toBe('Updated Description');
      
      // Check that the campaign was updated in the database
      const updatedCampaign = await FundItem.findOne({ id: 'campaign-test123' });
      expect(updatedCampaign.name).toBe('Updated Campaign Name');
      expect(updatedCampaign.description).toBe('Updated Description');
    });

    it('should return 404 if campaign to update is not found', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/campaigns/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Campaign Name'
        })
      });
      
      // Call the API
      const response = await PATCH(req, { params: { id: 'nonexistent' } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data.error).toBe('Campaign not found');
    });
  });
});
