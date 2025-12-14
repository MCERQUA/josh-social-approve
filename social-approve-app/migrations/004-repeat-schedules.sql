-- Migration: Repeat Scheduling System
-- Creates tables for managing recurring post schedules

-- Post schedules - defines the repeat pattern for a post
CREATE TABLE IF NOT EXISTS post_schedules (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  brand_id INT NOT NULL,

  -- Initial schedule
  first_publish_at TIMESTAMP NOT NULL,
  publish_time TIME NOT NULL, -- Time of day to publish (for repeats)

  -- Repeat settings
  repeat_type VARCHAR(20) NOT NULL DEFAULT 'none', -- 'none', 'weekly', 'biweekly', 'monthly', 'custom'
  repeat_interval INT DEFAULT 1,          -- every X weeks/months (for custom)
  repeat_day_of_week INT[],               -- 0=Sun, 1=Mon, etc (for weekly - can be multiple days)
  repeat_day_of_month INT,                -- 1-31 for monthly
  repeat_end_date DATE,                   -- optional end date for repeats

  -- Status and tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'paused', 'completed'
  created_by VARCHAR(100),                -- 'claude:session_id' or 'dashboard:user@email'
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  paused_at TIMESTAMP,

  -- Metadata
  notes TEXT,                             -- Optional notes about this schedule
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Schedule instances - individual scheduled posts generated from repeat schedules
CREATE TABLE IF NOT EXISTS schedule_instances (
  id SERIAL PRIMARY KEY,
  schedule_id INT NOT NULL,
  post_id INT NOT NULL,
  brand_id INT NOT NULL,

  -- When to publish
  scheduled_for TIMESTAMP NOT NULL,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'sending', 'sent', 'failed', 'skipped'

  -- Approval (each instance can be individually approved or auto-approved)
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,

  -- OneUp integration
  oneup_post_id VARCHAR(100),
  oneup_response JSONB,
  sent_at TIMESTAMP,
  error_message TEXT,

  -- Edit tracking
  is_modified BOOLEAN DEFAULT FALSE,      -- True if this instance was manually modified
  original_scheduled_for TIMESTAMP,       -- Original date before any edits
  skip_reason TEXT,                       -- If skipped, why

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_schedule FOREIGN KEY (schedule_id) REFERENCES post_schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_instance FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_brand_instance FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_brand ON post_schedules(brand_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON post_schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_post ON post_schedules(post_id);

CREATE INDEX IF NOT EXISTS idx_instances_schedule ON schedule_instances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_instances_scheduled_for ON schedule_instances(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_instances_status ON schedule_instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_brand ON schedule_instances(brand_id);
CREATE INDEX IF NOT EXISTS idx_instances_brand_date ON schedule_instances(brand_id, scheduled_for);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_post_schedules_updated_at ON post_schedules;
CREATE TRIGGER update_post_schedules_updated_at
    BEFORE UPDATE ON post_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_instances_updated_at ON schedule_instances;
CREATE TRIGGER update_schedule_instances_updated_at
    BEFORE UPDATE ON schedule_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment documentation
COMMENT ON TABLE post_schedules IS 'Defines repeat schedules for posts - one post can have one active schedule';
COMMENT ON TABLE schedule_instances IS 'Individual scheduled instances generated from repeat schedules';
COMMENT ON COLUMN post_schedules.repeat_type IS 'none=one-time, weekly=every X weeks, biweekly=every 2 weeks, monthly=same day each month, custom=every X days';
COMMENT ON COLUMN post_schedules.created_by IS 'Format: claude:session_id or dashboard:user@email.com';
COMMENT ON COLUMN schedule_instances.is_modified IS 'True if user manually changed this instance date/time';
