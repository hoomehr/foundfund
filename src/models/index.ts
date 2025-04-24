import mongoose, { Schema, model, models, Document } from 'mongoose';
import {
  User as UserType,
  FundItem as FundItemType,
  Contribution as ContributionType,
  CampaignAttachment as AttachmentType,
  CampaignUpdate as UpdateType,
  CampaignFAQ as FAQType,
  UserFollow as FollowType,
  CampaignBookmark as BookmarkType,
  Notification as NotificationType
} from '@/types';

// User Schema
const UserSchema = new Schema({
  id: { type: String }, // Include the id field from our seed data
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  bio: String,
  avatarUrl: String,
  totalCreated: { type: Number, default: 0 },
  totalFunded: { type: Number, default: 0 },
  totalRaised: { type: Number, default: 0 },
  totalContributed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Campaign Attachment Schema
const CampaignAttachmentSchema = new Schema({
  campaignId: { type: String, required: true },
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  description: String,
  type: {
    type: String,
    enum: ['pitch_deck', 'cv', 'business_plan', 'prototype', 'other'],
    required: true
  },
  uploadedAt: { type: Date, default: Date.now }
});

// Campaign Update Schema
const CampaignUpdateSchema = new Schema({
  campaignId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Campaign FAQ Schema
const CampaignFAQSchema = new Schema({
  campaignId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

// Fund Item (Campaign) Schema
const FundItemSchema = new Schema({
  id: { type: String }, // Include the id field from our seed data
  name: { type: String, required: true },
  description: { type: String, required: true },
  story: String,
  shortDescription: String,

  // Financial details
  fundingGoal: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  minContribution: Number,
  maxContribution: Number,

  // Categorization
  category: {
    type: String,
    enum: ['technology', 'art', 'music', 'film', 'games', 'publishing', 'fashion', 'food', 'community', 'other'],
    required: true
  },
  tags: [String],

  // Media
  imageUrl: String,
  galleryImages: [String],
  videoUrl: String,

  // Attachments
  attachments: [CampaignAttachmentSchema],

  // Dates
  createdAt: { type: Date, default: Date.now },
  publishedAt: Date,
  endDate: { type: Date, required: true },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'funded', 'expired', 'canceled'],
    default: 'draft',
    required: true
  },
  featured: { type: Boolean, default: false },

  // Relations
  creatorId: { type: String, required: true },
  contributionsCount: { type: Number, default: 0 },
  uniqueContributorsCount: { type: Number, default: 0 },

  // Updates and FAQs
  updates: [CampaignUpdateSchema],
  faqs: [CampaignFAQSchema]
});

// Contribution Schema
const ContributionSchema = new Schema({
  id: { type: String }, // Include the id field from our seed data
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
    required: true
  },
  message: String,
  anonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  // Relations - keeping old names for backward compatibility
  fundItemId: { type: String, required: true },
  userId: { type: String, required: true },

  // New relation names
  campaignId: String,
  contributorId: String
});

// User Follow Schema
const UserFollowSchema = new Schema({
  id: { type: String }, // Include the id field from our seed data
  followerId: { type: String, required: true },
  followedId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Campaign Bookmark Schema
const CampaignBookmarkSchema = new Schema({
  id: { type: String }, // Include the id field from our seed data
  userId: { type: String, required: true },
  campaignId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Notification Schema
const NotificationSchema = new Schema({
  id: { type: String }, // Include the id field from our seed data
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['contribution', 'campaign_update', 'goal_reached', 'campaign_ending', 'new_follower'],
    required: true
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: String,
  createdAt: { type: Date, default: Date.now }
});

// Define interfaces for the documents
export interface UserDocument extends Document, Omit<UserType, 'id'> {
  _id: string;
}

export interface FundItemDocument extends Document, Omit<FundItemType, 'id'> {
  _id: string;
}

export interface ContributionDocument extends Document, Omit<ContributionType, 'id'> {
  _id: string;
}

export interface UserFollowDocument extends Document, Omit<FollowType, 'id'> {
  _id: string;
}

export interface CampaignBookmarkDocument extends Document, Omit<BookmarkType, 'id'> {
  _id: string;
}

export interface NotificationDocument extends Document, Omit<NotificationType, 'id'> {
  _id: string;
}

// Create or get models with explicit collection names
export const User = models.User || model<UserDocument>('User', UserSchema, 'users');
export const FundItem = models.FundItem || model<FundItemDocument>('FundItem', FundItemSchema, 'funditems');
export const Contribution = models.Contribution || model<ContributionDocument>('Contribution', ContributionSchema, 'contributions');
export const UserFollow = models.UserFollow || model<UserFollowDocument>('UserFollow', UserFollowSchema, 'userfollows');
export const CampaignBookmark = models.CampaignBookmark || model<CampaignBookmarkDocument>('CampaignBookmark', CampaignBookmarkSchema, 'campaignbookmarks');
export const Notification = models.Notification || model<NotificationDocument>('Notification', NotificationSchema, 'notifications');

// Connect to MongoDB
export const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB already connected, readyState:', mongoose.connection.readyState);
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable not defined');
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  console.log('Connecting to MongoDB...');
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully to database:', connection.connection.db.databaseName);

    // List collections
    const collections = await connection.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};
