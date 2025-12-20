-- Migration: Add domain_folder column to websites table
-- This maps customer websites to Josh-AI folder structure

ALTER TABLE websites ADD COLUMN IF NOT EXISTS domain_folder VARCHAR(255);

-- Example mappings (run manually for existing websites):
-- UPDATE websites SET domain_folder = 'foamologyinsulation-web' WHERE url LIKE '%foamologyinsulation%';
-- UPDATE websites SET domain_folder = 'humble-help-roofing' WHERE url LIKE '%humblehelproofing%';

COMMENT ON COLUMN websites.domain_folder IS 'Folder name in /home/josh/Josh-AI/websites/ for content integration';
