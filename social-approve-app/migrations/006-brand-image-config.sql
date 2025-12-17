-- Add image generation configuration to brands table
-- This stores per-brand styling for social media image generation

-- Add image_config JSONB column to brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_config JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN brands.image_config IS 'Image generation config: {primaryColor, secondaryColor, backgroundColor, logoPath, logoPosition, industry, tagline, styleDescription, phone, website}';

-- Update CCA brand with image config
UPDATE brands SET image_config = '{
  "primaryColor": "#F97316",
  "secondaryColor": "#64748B",
  "backgroundColor": "#1F2937",
  "logoPath": "/clients/CCA/logos/logo.jpg",
  "logoPosition": "top-left",
  "industry": "contractor insurance agency",
  "tagline": "Insurance Built for Contractors",
  "styleDescription": "Professional business aesthetic with orange (#F97316) accents on clean dark slate backgrounds. Corporate, trustworthy, and modern design. The style should convey expertise and reliability in the insurance industry. Use orange as accent color for highlights and graphic elements.",
  "phone": "(480) 535-5880",
  "website": "contractorschoiceagency.com"
}'::jsonb
WHERE LOWER(slug) = 'cca';

-- Update ICA brand with image config
UPDATE brands SET image_config = '{
  "primaryColor": "#00CED1",
  "secondaryColor": "#000000",
  "backgroundColor": "#000000",
  "logoPath": "/clients/ICA/Company-Images/Insulation_Contractors_Logo_V3.png",
  "logoPosition": "top-left",
  "industry": "insulation contractor services",
  "tagline": "Arizona''s Extreme Heat Specialists",
  "styleDescription": "Professional template design with black background and flowing cyan (#00CED1) wave graphics. Modern and sleek with high contrast. Premium marketing template style with clean lines and professional contractor branding. The cyan color should be prominent as accent waves or flowing graphic elements.",
  "phone": "623-241-1939",
  "website": "insulationcontractorsofarizona.com"
}'::jsonb
WHERE LOWER(slug) = 'ica';

-- Create index for faster lookups (optional, for when you have many brands)
CREATE INDEX IF NOT EXISTS idx_brands_image_config ON brands USING GIN (image_config);
