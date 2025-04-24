export type FundingStatus = 'active' | 'funded' | 'expired';

export type Category = 'technology' | 'art' | 'food' | 'fashion' | 'games' | 'other';

export interface FundItem {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  category: Category;
  fundingGoal: number;
  currentAmount: number;
  status: FundingStatus;
  createdAt: string;
  endDate: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isCreator: boolean;
}

export interface Contribution {
  id: string;
  fundItemId: string;
  userId: string;
  amount: number;
  createdAt: string;
}
