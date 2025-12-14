-- Migration: Add scheduling capabilities to social media posts
-- Date: 2025-12-14

-- Add scheduling columns to approvals table
ALTER TABLE approvals
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
ADD COLUMN IF NOT EXISTS scheduled_status VARCHAR(20) DEFAULT 'not_scheduled'
  CHECK (scheduled_status IN ('not_scheduled', 'scheduled', 'publishing', 'published', 'failed')),
ADD COLUMN IF NOT EXISTS oneup_post_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS oneup_category_id INTEGER,
ADD COLUMN IF NOT EXISTS target_platforms JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS publish_error TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- Create index for scheduled posts queries
CREATE INDEX IF NOT EXISTS idx_approvals_scheduled_for ON approvals(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_approvals_scheduled_status ON approvals(scheduled_status);

-- Create scheduling_history table for tracking all scheduling actions
CREATE TABLE IF NOT EXISTS scheduling_history (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  scheduled_for TIMESTAMP,
  platforms JSONB,
  oneup_response JSONB,
  error_message TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduling_history_post_id ON scheduling_history(post_id);

-- Create oneup_categories table to cache OneUp category/account info
CREATE TABLE IF NOT EXISTS oneup_categories (
  id SERIAL PRIMARY KEY,
  oneup_category_id INTEGER NOT NULL UNIQUE,
  category_name VARCHAR(255) NOT NULL,
  accounts JSONB DEFAULT '[]',
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
