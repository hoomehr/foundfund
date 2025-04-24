/**
 * FoundFund Data Models
 * 
 * This file contains the TypeScript interfaces for the core data models
 * used in the FoundFund application. These models can be adapted for
 * different database implementations.
 */

// User Model
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Stats
  totalCreated: number;  // Number of campaigns created
  totalFunded: number;   // Number of campaigns funded
  totalRaised: number;   // Total amount raised across all campaigns
  totalContributed: number; // Total amount contributed to other campaigns
}

// Campaign Model
export type CampaignStatus = 'draft' | 'active' | 'funded' | 'expired' | 'canceled';
export type CampaignCategory = 'technology' | 'art' | 'music' | 'film' | 'games' | 'publishing' | 'fashion' | 'food' | 'community' | 'other';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  story: string;  // Detailed campaign story/content
  shortDescription: string; // Brief summary for cards
  
  // Financial details
  fundingGoal: number;
  currentAmount: number;
  minContribution?: number;
  maxContribution?: number;
  
  // Categorization
  category: CampaignCategory;
  tags: string[];
  
  // Media
  imageUrl?: string;
  galleryImages?: string[];
  videoUrl?: string;
  
  // Attachments
  attachments?: CampaignAttachment[];
  
  // Dates
  createdAt: Date;
  publishedAt?: Date;
  endDate: Date;
  
  // Status
  status: CampaignStatus;
  featured: boolean;
  
  // Relations
  creatorId: string;
  contributionsCount: number;
  uniqueContributorsCount: number;
  
  // Updates and FAQs
  updates: CampaignUpdate[];
  faqs: CampaignFAQ[];
}

export interface CampaignAttachment {
  id: string;
  campaignId: string;
  name: string;
  fileUrl: string;
  fileType: string; // e.g., 'pdf', 'doc', 'image'
  fileSize: number; // in bytes
  description?: string;
  type: 'pitch_deck' | 'cv' | 'business_plan' | 'prototype' | 'other';
  uploadedAt: Date;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface CampaignFAQ {
  id: string;
  campaignId: string;
  question: string;
  answer: string;
}

// Contribution Model
export interface Contribution {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  message?: string;  // Optional message from contributor
  anonymous: boolean; // Whether to show contributor's name publicly
  createdAt: Date;
  
  // Relations
  campaignId: string;
  contributorId: string;
}

// Relationship Models
export interface UserFollow {
  id: string;
  followerId: string;  // User who is following
  followedId: string;  // User being followed
  createdAt: Date;
}

export interface CampaignBookmark {
  id: string;
  userId: string;
  campaignId: string;
  createdAt: Date;
}

// Notification Model
export type NotificationType = 'contribution' | 'campaign_update' | 'goal_reached' | 'campaign_ending' | 'new_follower';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  relatedId?: string;  // ID of related entity (campaign, contribution, etc.)
  createdAt: Date;
}

// Analytics Models
export interface CampaignAnalytics {
  campaignId: string;
  views: number;
  uniqueVisitors: number;
  conversionRate: number;  // % of visitors who contribute
  averageContribution: number;
  dailyStats: DailyStats[];
  referralSources: ReferralSource[];
}

export interface DailyStats {
  date: Date;
  views: number;
  contributions: number;
  amount: number;
}

export interface ReferralSource {
  source: string;
  count: number;
  conversions: number;
}
