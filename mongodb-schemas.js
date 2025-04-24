/**
 * FoundFund MongoDB Schemas
 * 
 * This file contains MongoDB schema definitions for the FoundFund application.
 * These schemas can be used with Mongoose or similar MongoDB ODMs.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  bio: { type: String },
  avatarUrl: { type: String },
  
  // Stats
  totalCreated: { type: Number, default: 0 },
  totalFunded: { type: Number, default: 0 },
  totalRaised: { type: Number, default: 0 },
  totalContributed: { type: Number, default: 0 },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for relationships
userSchema.virtual('campaigns', {
  ref: 'Campaign',
  localField: '_id',
  foreignField: 'creatorId'
});

userSchema.virtual('contributions', {
  ref: 'Contribution',
  localField: '_id',
  foreignField: 'contributorId'
});

// Campaign Attachment Schema
const campaignAttachmentSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['pitch_deck', 'cv', 'business_plan', 'prototype', 'other'],
    required: true 
  },
  uploadedAt: { type: Date, default: Date.now }
});

// Campaign Update Schema
const campaignUpdateSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Campaign FAQ Schema
const campaignFAQSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

// Campaign Schema
const campaignSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  story: { type: String, required: true },
  shortDescription: { type: String, required: true },
  
  // Financial details
  fundingGoal: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  minContribution: { type: Number },
  maxContribution: { type: Number },
  
  // Categorization
  category: { 
    type: String, 
    enum: ['technology', 'art', 'music', 'film', 'games', 'publishing', 'fashion', 'food', 'community', 'other'],
    required: true 
  },
  tags: [{ type: String }],
  
  // Media
  imageUrl: { type: String },
  galleryImages: [{ type: String }],
  videoUrl: { type: String },
  
  // Attachments - embedded or referenced
  attachments: [campaignAttachmentSchema], // Embedded approach
  
  // Dates
  publishedAt: { type: Date },
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
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contributionsCount: { type: Number, default: 0 },
  uniqueContributorsCount: { type: Number, default: 0 },
  
  // Updates and FAQs - embedded or referenced
  updates: [campaignUpdateSchema], // Embedded approach
  faqs: [campaignFAQSchema], // Embedded approach
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for relationships
campaignSchema.virtual('contributions', {
  ref: 'Contribution',
  localField: '_id',
  foreignField: 'campaignId'
});

campaignSchema.virtual('creator', {
  ref: 'User',
  localField: 'creatorId',
  foreignField: '_id',
  justOne: true
});

// Contribution Schema
const contributionSchema = new Schema({
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    required: true 
  },
  message: { type: String },
  anonymous: { type: Boolean, default: false },
  
  // Relations
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  contributorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for relationships
contributionSchema.virtual('campaign', {
  ref: 'Campaign',
  localField: 'campaignId',
  foreignField: '_id',
  justOne: true
});

contributionSchema.virtual('contributor', {
  ref: 'User',
  localField: 'contributorId',
  foreignField: '_id',
  justOne: true
});

// User Follow Schema
const userFollowSchema = new Schema({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Campaign Bookmark Schema
const campaignBookmarkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['contribution', 'campaign_update', 'goal_reached', 'campaign_ending', 'new_follower'],
    required: true 
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId }, // Generic ObjectId reference
  createdAt: { type: Date, default: Date.now }
});

// Daily Stats Schema (for analytics)
const dailyStatsSchema = new Schema({
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  contributions: { type: Number, default: 0 },
  amount: { type: Number, default: 0 }
});

// Referral Source Schema (for analytics)
const referralSourceSchema = new Schema({
  source: { type: String, required: true },
  count: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 }
});

// Campaign Analytics Schema
const campaignAnalyticsSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  views: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  averageContribution: { type: Number, default: 0 },
  dailyStats: [dailyStatsSchema],
  referralSources: [referralSourceSchema]
});

// Create and export models
const models = {
  User: mongoose.model('User', userSchema),
  Campaign: mongoose.model('Campaign', campaignSchema),
  Contribution: mongoose.model('Contribution', contributionSchema),
  UserFollow: mongoose.model('UserFollow', userFollowSchema),
  CampaignBookmark: mongoose.model('CampaignBookmark', campaignBookmarkSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  CampaignAnalytics: mongoose.model('CampaignAnalytics', campaignAnalyticsSchema)
};

module.exports = models;
