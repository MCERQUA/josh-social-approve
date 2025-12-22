-- Add column to store original image (without logo) for re-editing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_original_filename VARCHAR(255);

-- For existing posts with images, set original = current (they don't have logos yet)
UPDATE posts
SET image_original_filename = image_filename
WHERE image_filename IS NOT NULL
  AND image_original_filename IS NULL;
