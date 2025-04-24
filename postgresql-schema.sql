/**
 * FoundFund PostgreSQL Schema
 * 
 * This file contains SQL statements to create the database schema for the FoundFund application
 * using PostgreSQL. It includes tables, relationships, indexes, and constraints.
 */

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'funded', 'expired', 'canceled');
CREATE TYPE campaign_category AS ENUM ('technology', 'art', 'music', 'film', 'games', 'publishing', 'fashion', 'food', 'community', 'other');
CREATE TYPE contribution_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('contribution', 'campaign_update', 'goal_reached', 'campaign_ending', 'new_follower');
CREATE TYPE attachment_type AS ENUM ('pitch_deck', 'cv', 'business_plan', 'prototype', 'other');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    total_created INTEGER DEFAULT 0,
    total_funded INTEGER DEFAULT 0,
    total_raised DECIMAL(12, 2) DEFAULT 0,
    total_contributed DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    story TEXT NOT NULL,
    short_description VARCHAR(255) NOT NULL,
    
    -- Financial details
    funding_goal DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    min_contribution DECIMAL(12, 2),
    max_contribution DECIMAL(12, 2),
    
    -- Categorization
    category campaign_category NOT NULL,
    tags TEXT[] DEFAULT '{}',
    
    -- Media
    image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    video_url TEXT,
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status campaign_status DEFAULT 'draft' NOT NULL,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Relations
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contributions_count INTEGER DEFAULT 0,
    unique_contributors_count INTEGER DEFAULT 0,
    
    -- Indexes
    CONSTRAINT funding_goal_positive CHECK (funding_goal > 0)
);

-- Create indexes for campaigns
CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_featured ON campaigns(featured);

-- Campaign attachments table
CREATE TABLE campaign_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    description TEXT,
    type attachment_type NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for campaign attachments
CREATE INDEX idx_attachments_campaign ON campaign_attachments(campaign_id);

-- Campaign updates table
CREATE TABLE campaign_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for campaign updates
CREATE INDEX idx_updates_campaign ON campaign_updates(campaign_id);

-- Campaign FAQs table
CREATE TABLE campaign_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

-- Create index for campaign FAQs
CREATE INDEX idx_faqs_campaign ON campaign_faqs(campaign_id);

-- Contributions table
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(12, 2) NOT NULL,
    status contribution_status DEFAULT 'pending' NOT NULL,
    message TEXT,
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Create indexes for contributions
CREATE INDEX idx_contributions_campaign ON contributions(campaign_id);
CREATE INDEX idx_contributions_contributor ON contributions(contributor_id);
CREATE INDEX idx_contributions_status ON contributions(status);

-- User follows table
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_follow UNIQUE (follower_id, followed_id),
    CONSTRAINT no_self_follow CHECK (follower_id != followed_id)
);

-- Create indexes for user follows
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_followed ON user_follows(followed_id);

-- Campaign bookmarks table
CREATE TABLE campaign_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_bookmark UNIQUE (user_id, campaign_id)
);

-- Create indexes for campaign bookmarks
CREATE INDEX idx_bookmarks_user ON campaign_bookmarks(user_id);
CREATE INDEX idx_bookmarks_campaign ON campaign_bookmarks(campaign_id);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Campaign analytics table
CREATE TABLE campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    average_contribution DECIMAL(12, 2) DEFAULT 0,
    
    CONSTRAINT unique_campaign_analytics UNIQUE (campaign_id)
);

-- Daily stats table for analytics
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_analytics_id UUID NOT NULL REFERENCES campaign_analytics(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    contributions INTEGER DEFAULT 0,
    amount DECIMAL(12, 2) DEFAULT 0,
    
    CONSTRAINT unique_daily_stat UNIQUE (campaign_analytics_id, date)
);

-- Referral sources table for analytics
CREATE TABLE referral_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_analytics_id UUID NOT NULL REFERENCES campaign_analytics(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    count INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    CONSTRAINT unique_referral_source UNIQUE (campaign_analytics_id, source)
);

-- Create indexes for analytics
CREATE INDEX idx_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX idx_daily_stats_analytics ON daily_stats(campaign_analytics_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
CREATE INDEX idx_referral_analytics ON referral_sources(campaign_analytics_id);

-- Create trigger functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger functions to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_contribution_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign current amount and contribution counts
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE campaigns
        SET 
            current_amount = current_amount + NEW.amount,
            contributions_count = contributions_count + 1
        WHERE id = NEW.campaign_id;
        
        -- Update unique contributors count
        UPDATE campaigns c
        SET unique_contributors_count = (
            SELECT COUNT(DISTINCT contributor_id)
            FROM contributions
            WHERE campaign_id = c.id AND status = 'completed'
        )
        WHERE id = NEW.campaign_id;
        
        -- Update user stats
        UPDATE users
        SET total_contributed = total_contributed + NEW.amount,
            total_funded = (
                SELECT COUNT(DISTINCT campaign_id)
                FROM contributions
                WHERE contributor_id = NEW.contributor_id AND status = 'completed'
            )
        WHERE id = NEW.contributor_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            -- Contribution became completed
            UPDATE campaigns
            SET 
                current_amount = current_amount + NEW.amount,
                contributions_count = contributions_count + 1
            WHERE id = NEW.campaign_id;
            
            -- Update user stats
            UPDATE users
            SET total_contributed = total_contributed + NEW.amount
            WHERE id = NEW.contributor_id;
            
        ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            -- Contribution no longer completed
            UPDATE campaigns
            SET 
                current_amount = current_amount - OLD.amount,
                contributions_count = contributions_count - 1
            WHERE id = NEW.campaign_id;
            
            -- Update user stats
            UPDATE users
            SET total_contributed = total_contributed - OLD.amount
            WHERE id = NEW.contributor_id;
        END IF;
        
        -- Update unique contributors count
        UPDATE campaigns c
        SET unique_contributors_count = (
            SELECT COUNT(DISTINCT contributor_id)
            FROM contributions
            WHERE campaign_id = c.id AND status = 'completed'
        )
        WHERE id = NEW.campaign_id;
        
        -- Update user funded count
        UPDATE users
        SET total_funded = (
            SELECT COUNT(DISTINCT campaign_id)
            FROM contributions
            WHERE contributor_id = NEW.contributor_id AND status = 'completed'
        )
        WHERE id = NEW.contributor_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contribution stats
CREATE TRIGGER update_contribution_stats
AFTER INSERT OR UPDATE ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_campaign_contribution_stats();

-- Create trigger function to update campaign status based on funding and dates
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if campaign is funded
    IF NEW.current_amount >= NEW.funding_goal AND NEW.status = 'active' THEN
        NEW.status = 'funded';
    END IF;
    
    -- Check if campaign is expired
    IF NEW.end_date < NOW() AND NEW.status IN ('active', 'draft') THEN
        NEW.status = 'expired';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for campaign status
CREATE TRIGGER update_campaign_status_trigger
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaign_status();

-- Create function to update user's total_raised when campaign amount changes
CREATE OR REPLACE FUNCTION update_user_total_raised()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.current_amount != NEW.current_amount THEN
        UPDATE users
        SET total_raised = (
            SELECT COALESCE(SUM(current_amount), 0)
            FROM campaigns
            WHERE creator_id = NEW.creator_id
        )
        WHERE id = NEW.creator_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user total raised
CREATE TRIGGER update_user_total_raised_trigger
AFTER UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_user_total_raised();

-- Create function to update user's total_created when a campaign is created
CREATE OR REPLACE FUNCTION update_user_total_created()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users
        SET total_created = total_created + 1
        WHERE id = NEW.creator_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user total created
CREATE TRIGGER update_user_total_created_trigger
AFTER INSERT ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_user_total_created();
