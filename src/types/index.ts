export type FundingStatus = 'draft' | 'active' | 'funded' | 'expired' | 'canceled';

export type Category = 'technology' | 'art' | 'music' | 'film' | 'games' | 'publishing' | 'fashion' | 'food' | 'community' | 'other';

export type AttachmentType = 'pitch_deck' | 'cv' | 'business_plan' | 'prototype' | 'other';

export type ContributionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type NotificationType = 'contribution' | 'campaign_update' | 'goal_reached' | 'campaign_ending' | 'new_follower';

// We'll keep FundItem for backward compatibility but it's essentially a Campaign
export interface FundItem {
  id: string;
  name: string;
  description: string;
  story?: string;
  shortDescription?: string;

  // Financial details
  fundingGoal: number;
  currentAmount: number;
  minContribution?: number;
  maxContribution?: number;

  // Categorization
  category: Category;
  tags?: string[];

  // Media
  imageUrl?: string;
  galleryImages?: string[];
  videoUrl?: string;

  // Attachments
  attachments?: CampaignAttachment[];

  // Dates
  createdAt: string;
  publishedAt?: string;
  endDate: string;

  // Status
  status: FundingStatus;
  featured?: boolean;

  // Relations
  creatorId: string;
  contributionsCount?: number;
  uniqueContributorsCount?: number;

  // Updates and FAQs
  updates?: CampaignUpdate[];
  faqs?: CampaignFAQ[];
}

// Alias for Campaign to maintain backward compatibility
export type Campaign = FundItem;

export interface CampaignAttachment {
  id: string;
  campaignId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  type: AttachmentType;
  uploadedAt: string;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface CampaignFAQ {
  id: string;
  campaignId: string;
  question: string;
  answer: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional in the type since we don't always want to expose it
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;

  // Stats
  totalCreated?: number;
  totalFunded?: number;
  totalRaised?: number;
  totalContributed?: number;
}

export interface Contribution {
  id: string;
  amount: number;
  status?: ContributionStatus;
  message?: string;
  anonymous?: boolean;
  createdAt: string;

  // Relations - keeping old names for backward compatibility
  fundItemId: string;
  userId: string;

  // New relation names
  campaignId?: string;
  contributorId?: string;
}

export interface UserFollow {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: string;
}

export interface CampaignBookmark {
  id: string;
  userId: string;
  campaignId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}
