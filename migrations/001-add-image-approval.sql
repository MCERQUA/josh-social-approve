-- Migration: Add two-stage approval (text + image)
-- This adds separate tracking for image approval after text is approved

-- Add new columns for image approval
ALTER TABLE approvals
ADD COLUMN IF NOT EXISTS image_status VARCHAR(20) DEFAULT 'not_ready' CHECK (image_status IN ('not_ready', 'pending', 'approved', 'rejected'));

ALTER TABLE approvals
ADD COLUMN IF NOT EXISTS image_rejection_reason TEXT;

ALTER TABLE approvals
ADD COLUMN IF NOT EXISTS image_reviewed_at TIMESTAMP;

-- Create index for image status queries
CREATE INDEX IF NOT EXISTS idx_approvals_image_status ON approvals(image_status);

-- Update existing approved posts to have pending image status
-- (so they can proceed to image approval stage)
UPDATE approvals
SET image_status = 'pending'
WHERE status = 'approved' AND image_status = 'not_ready';

-- Comments:
-- status = text approval status (pending, approved, rejected)
-- image_status = image approval status:
--   'not_ready' = text not yet approved, cannot approve image
--   'pending' = text approved, image awaiting review
--   'approved' = image approved (fully ready to publish)
--   'rejected' = image rejected, needs regeneration
