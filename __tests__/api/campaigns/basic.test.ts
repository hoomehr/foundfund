import { FundItem, User } from '@/models';

describe('Campaign Model', () => {
  beforeEach(async () => {
    // Clear the collections before each test
    await FundItem.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a campaign', async () => {
    // Create a test user
    const user = await User.create({
      id: 'user1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      bio: 'Test bio',
      avatarUrl: 'https://example.com/avatar.jpg'
    });

    // Create a test campaign
    const campaign = await FundItem.create({
      id: 'campaign1',
      name: 'Test Campaign',
      description: 'Test Description',
      category: 'technology',
      fundingGoal: 1000,
      currentAmount: 0,
      imageUrl: 'https://example.com/image.jpg',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      creatorId: user.id,
      tags: ['tech', 'innovative'],
      status: 'active'
    });

    // Verify the campaign was created
    expect(campaign).toBeDefined();
    expect(campaign.id).toBe('campaign1');
    expect(campaign.name).toBe('Test Campaign');
    expect(campaign.creatorId).toBe('user1');
    expect(campaign.currentAmount).toBe(0);
  });

  it('should find campaigns by creator', async () => {
    // Create test users
    const user1 = await User.create({
      id: 'user1',
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123'
    });

    const user2 = await User.create({
      id: 'user2',
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123'
    });

    // Create test campaigns
    await FundItem.create({
      id: 'campaign1',
      name: 'User 1 Campaign',
      description: 'Test Description',
      category: 'technology',
      fundingGoal: 1000,
      creatorId: user1.id,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await FundItem.create({
      id: 'campaign2',
      name: 'User 2 Campaign',
      description: 'Test Description',
      category: 'art',
      fundingGoal: 2000,
      creatorId: user2.id,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Find campaigns by creator
    const user1Campaigns = await FundItem.find({ creatorId: user1.id });
    const user2Campaigns = await FundItem.find({ creatorId: user2.id });

    // Verify the results
    expect(user1Campaigns).toHaveLength(1);
    expect(user1Campaigns[0].name).toBe('User 1 Campaign');
    expect(user1Campaigns[0].category).toBe('technology');

    expect(user2Campaigns).toHaveLength(1);
    expect(user2Campaigns[0].name).toBe('User 2 Campaign');
    expect(user2Campaigns[0].category).toBe('art');
  });
});
