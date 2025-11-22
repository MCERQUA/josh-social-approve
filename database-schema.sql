-- Social Media Post Approval System Database Schema
-- Neon PostgreSQL Database

-- Create posts table to store all social media posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  post_index INTEGER NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'facebook' or 'google_business'
  content TEXT NOT NULL,
  image_filename VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create approvals table to track approval status
CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_post_id ON approvals(post_id);

-- Insert sample data (you can customize this based on your needs)
-- The post_index corresponds to the image number (0-53)
INSERT INTO posts (post_index, title, platform, content, image_filename) VALUES
(0, 'California HVAC Contractor Insurance', 'facebook', '💨 California HVAC contractors: Are you C-20 compliant?

New workers comp requirements could cost you $100K+ in fines. Our complete 2025 guide covers everything you need to know about C-20 license insurance requirements, costs, and compliance.

➡️ Read the full guide: [LINK]

#HVACInsurance #CaliforniaContractors #C20License', 'CCA-_0000_Layer-54.png'),

(1, 'California HVAC Contractor Insurance', 'google_business', '📋 California HVAC Contractor Insurance Guide

C-20 license holders: Get the complete breakdown of workers comp, general liability, and commercial auto requirements for 2025. Real cost examples and compliance strategies included.

Learn More: [LINK]

Call for free quote: 1-844-967-5247', 'CCA-_0001_Layer-53.png'),

(2, 'Alabama Contractor Workers Comp', 'facebook', '⚠️ Alabama contractors: Workers comp violations = business shutdown

Alabama requires workers comp from your FIRST employee. No exemptions. No exceptions. Learn the requirements, costs, and how to stay compliant in 2025.

Full guide: [LINK]

#AlabamaContractors #WorkersComp #ContractorInsurance', 'CCA-_0002_Layer-52.png'),

(3, 'Alabama Contractor Workers Comp', 'google_business', 'Alabama Contractor Workers Compensation Requirements 2025

Mandatory coverage from first employee. Penalties up to $100,000 for non-compliance. Our comprehensive guide explains requirements, costs, and compliance strategies.

Get protected today: [LINK]
844-967-5247', 'CCA-_0003_Layer-51.png')
ON CONFLICT (post_index) DO NOTHING;

-- Create default pending approvals for all posts
INSERT INTO approvals (post_id, status)
SELECT id, 'pending' FROM posts
ON CONFLICT (post_id) DO NOTHING;
