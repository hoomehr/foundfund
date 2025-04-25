import {
  User,
  FundItem,
  Contribution,
  Category,
  FundingStatus
} from '@/types';

// Base API URL
const API_BASE = '/api';

// User API
export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/users`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`${API_BASE}/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user with id ${id}`);
  }
  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  // For now, we'll just return the first user
  // In a real app, this would use authentication
  const users = await getUsers();

  // If no users are found, create a default user
  if (!users || users.length === 0) {
    const defaultUser: User = {
      id: 'default-user',
      username: 'defaultuser',
      name: 'Default User',
      email: 'default@example.com',
      bio: 'This is a default user created because no users were found in the database.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalCreated: 0,
      totalFunded: 0,
      totalRaised: 0,
      totalContributed: 0,
    };

    return defaultUser;
  }

  return users[0];
}

// Campaign API
export async function getCampaigns(params?: {
  creatorId?: string;
  category?: Category | 'all';
  status?: FundingStatus | 'all';
  featured?: boolean;
}): Promise<FundItem[]> {
  let url = `${API_BASE}/campaigns`;

  if (params) {
    const queryParams = new URLSearchParams();

    if (params.creatorId) {
      queryParams.append('creatorId', params.creatorId);
    }

    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }

    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }

    if (params.featured !== undefined) {
      queryParams.append('featured', params.featured.toString());
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }

  try {
    console.log(`Fetching campaigns with params:`, params);
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching campaigns:`, errorData);
      throw new Error('Failed to fetch campaigns');
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} campaigns`);
    return data;
  } catch (error) {
    console.error(`Error in getCampaigns:`, error);
    throw error;
  }
}

export async function getCampaignById(id: string): Promise<FundItem> {
  try {
    console.log(`Fetching campaign with id ${id}`);
    const response = await fetch(`${API_BASE}/campaigns/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching campaign ${id}:`, errorData);
      throw new Error(`Failed to fetch campaign with id ${id}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched campaign ${id}`);
    return data;
  } catch (error) {
    console.error(`Error in getCampaignById(${id}):`, error);
    throw error;
  }
}

export async function getCampaignsByCreator(creatorId: string): Promise<FundItem[]> {
  return getCampaigns({ creatorId });
}

// Contribution API
export async function getContributions(params?: {
  campaignId?: string;
  userId?: string;
  contributorId?: string;
}): Promise<Contribution[]> {
  let url = `${API_BASE}/contributions`;

  if (params) {
    const queryParams = new URLSearchParams();

    if (params.campaignId) {
      queryParams.append('campaignId', params.campaignId);
    }

    if (params.userId) {
      queryParams.append('userId', params.userId);
    }

    if (params.contributorId) {
      queryParams.append('contributorId', params.contributorId);
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }

  try {
    console.log(`Fetching contributions with params:`, params);
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching contributions:`, errorData);
      throw new Error('Failed to fetch contributions');
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} contributions`);
    return data;
  } catch (error) {
    console.error(`Error in getContributions:`, error);
    throw error;
  }
}

export async function getContributionsByCampaign(campaignId: string): Promise<Contribution[]> {
  return getContributions({ campaignId });
}

export async function getContributionsByUser(userId: string): Promise<Contribution[]> {
  return getContributions({ userId });
}

export async function getContributionsByContributor(contributorId: string): Promise<Contribution[]> {
  return getContributions({ contributorId });
}

// Helper functions
export function getCategories(): Category[] {
  return [
    'technology',
    'art',
    'music',
    'film',
    'games',
    'publishing',
    'fashion',
    'food',
    'community',
    'other'
  ];
}

export function getFundingStatuses(): FundingStatus[] {
  return ['draft', 'active', 'funded', 'expired', 'canceled'];
}
