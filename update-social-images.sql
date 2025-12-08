-- Update image filenames for posts with new optimized social images
-- Run this against the Neon PostgreSQL database

-- COI & Certificate Posts
UPDATE posts SET image_filename = 'coi-45-percent-rejection-rate-social.png'
WHERE title = 'The 45% Rejection Rate';

UPDATE posts SET image_filename = 'additional-insured-trap-social.png'
WHERE title = 'The Additional Insured Trap';

UPDATE posts SET image_filename = 'waiver-subrogation-secret-social.png'
WHERE title = 'The Waiver of Subrogation Secret';

UPDATE posts SET image_filename = 'endorsement-error-8500-social.png'
WHERE title = 'The $8,500 Endorsement Error';

UPDATE posts SET image_filename = 'primary-vs-excess-coverage-social.png'
WHERE title = 'The Primary vs Excess Coverage Confusion';

UPDATE posts SET image_filename = 'blanket-vs-scheduled-coverage-social.png'
WHERE title = 'The Blanket vs Scheduled Mistake';

UPDATE posts SET image_filename = 'operations-completed-gap-social.png'
WHERE title = 'The Operations Completed Gap';

-- Commercial Auto Posts
UPDATE posts SET image_filename = 'personal-auto-myth-social.png'
WHERE title = 'The Personal Auto Myth';

UPDATE posts SET image_filename = 'dot-violation-surprise-social.png'
WHERE title = 'The DOT Violation Surprise';

UPDATE posts SET image_filename = 'employee-personal-vehicle-risk-social.png'
WHERE title = 'The Employee Personal Vehicle Risk';

UPDATE posts SET image_filename = 'radius-restriction-trap-social.png'
WHERE title = 'The Radius Restriction Trap';

UPDATE posts SET image_filename = 'tool-theft-coverage-myth-social.png'
WHERE title = 'The Tool Theft Coverage Myth';

-- Workers Comp State Posts
UPDATE posts SET image_filename = 'california-50000-trap-social.png'
WHERE title = 'The California $50,000 Trap';

UPDATE posts SET image_filename = 'pennsylvania-fund-vs-private-social.png'
WHERE title = 'The Pennsylvania Fund vs Private Decision';

-- State-specific guide posts (Michigan)
UPDATE posts SET image_filename = 'michigan-contractor-insurance-facebook-social.png'
WHERE title = 'Michigan Contractor Insurance Guide' AND platform = 'facebook';

UPDATE posts SET image_filename = 'michigan-contractor-insurance-google-social.png'
WHERE title = 'Michigan Contractor Insurance Guide' AND platform = 'google_business';

-- Utah guide posts
UPDATE posts SET image_filename = 'utah-contractor-insurance-social.png'
WHERE title = 'Utah Contractor Insurance Guide';

-- Verify the updates
SELECT title, platform, image_filename
FROM posts
WHERE image_filename LIKE '%-social.png'
ORDER BY title;
