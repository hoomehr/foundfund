import {
  User,
  FundItem,
  Contribution,
  Category,
  FundingStatus,
  Transaction,
  TransactionStatus,
  PaymentProvider
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
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error('Failed to fetch campaigns');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getCampaignById(id: string): Promise<FundItem> {
  try {
    const response = await fetch(`${API_BASE}/campaigns/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch campaign with id ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getCampaignsByCreator(creatorId: string): Promise<FundItem[]> {
  return getCampaigns({ creatorId });
}

export async function setFeaturedStatus(id: string, featured: boolean): Promise<FundItem> {
  try {
    const response = await fetch(`${API_BASE}/campaigns/feature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, featured }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to set featured status for campaign ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
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
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error('Failed to fetch contributions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
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
  try {
    // First try with contributorId
    const contributionsWithContributorId = await getContributions({ contributorId });

    // Then try with userId
    const contributionsWithUserId = await getContributions({ userId: contributorId });

    // Combine results, removing duplicates by ID
    const allContributions = [...contributionsWithContributorId];

    // Add contributions from userId search that aren't already in the results
    for (const contribution of contributionsWithUserId) {
      if (!allContributions.some(c => c.id === contribution.id)) {
        allContributions.push(contribution);
      }
    }

    return allContributions;
  } catch (error) {
    throw error;
  }
}

export async function createContribution(contribution: Partial<Contribution>): Promise<Contribution> {
  try {
    const response = await fetch(`${API_BASE}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contribution),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create contribution: ${errorData?.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function createStripeCheckoutSession(data: {
  campaignId: string;
  amount: number;
  userId: string;
  message?: string;
  anonymous?: boolean;
}): Promise<{ sessionId: string; url: string }> {
  try {
    const response = await fetch(`${API_BASE}/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create checkout session: ${errorData?.error || response.statusText}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
}

// Transaction API
export async function getTransactions(params?: {
  campaignId?: string;
  contributorId?: string;
  status?: TransactionStatus;
  provider?: PaymentProvider;
  providerTransactionId?: string;
}): Promise<Transaction[]> {
  let url = `${API_BASE}/transactions`;

  if (params) {
    const queryParams = new URLSearchParams();

    if (params.campaignId) {
      queryParams.append('campaignId', params.campaignId);
    }

    if (params.contributorId) {
      queryParams.append('contributorId', params.contributorId);
    }

    if (params.status) {
      queryParams.append('status', params.status);
    }

    if (params.provider) {
      queryParams.append('provider', params.provider);
    }

    if (params.providerTransactionId) {
      queryParams.append('providerTransactionId', params.providerTransactionId);
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getTransactionById(id: string): Promise<Transaction> {
  try {
    const response = await fetch(`${API_BASE}/transactions/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch transaction with id ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function createTransaction(transaction: Partial<Transaction>): Promise<Transaction> {
  try {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create transaction: ${errorData?.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  try {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update transaction: ${errorData?.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
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

export function getTransactionStatuses(): TransactionStatus[] {
  return ['pending', 'processing', 'completed', 'failed', 'refunded'];
}

export function getPaymentProviders(): PaymentProvider[] {
  return ['stripe', 'paypal', 'manual', 'other'];
}
