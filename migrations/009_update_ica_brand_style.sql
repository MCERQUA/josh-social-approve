-- Migration: Update ICA brand with advertisement-style image template
-- This updates the image_config to generate branded social media ads with text overlays

UPDATE brands
SET image_config = jsonb_build_object(
  'primaryColor', '#00CED1',
  'secondaryColor', '#000000',
  'backgroundColor', '#000000',
  'logoPath', '/clients/ICA/Company-Images/Insulation_Contractors_Logo_V3.png',
  'logoPosition', 'top-left',
  'industry', 'insulation contractors',
  'tagline', 'Arizona''s Extreme Heat Specialists',
  'phone', '623-241-1939',
  'website', 'InsulationContractorsofArizona.com',
  'styleDescription', 'DESIGN LAYOUT for ICA - Insulation Contractors of Arizona branded social media advertisement:

OVERALL COMPOSITION:
- Solid BLACK background (#000000)
- Cyan/teal flowing wave graphic (#00CED1) in upper portion
- Modern, clean, professional look

VISUAL ELEMENTS (DO NOT INCLUDE spray foam equipment or application):
- Focus on RESULTS: thermal imaging cameras, comfortable homes, energy savings concepts
- Professional contractors with tablets/clipboards (NOT applying foam)
- Happy families in comfortable Arizona homes
- Desert landscaping with modern homes
- Temperature contrast visuals (hot sun vs cool interior)
- Completed insulation visible in attic (NOT being applied)

TEXT TO INCLUDE (use these fonts and colors):
- HEADLINE: Large, bold, CYAN (#00CED1) text at center
- Subtext: White text below headline with key benefit
- Phone: "623-241-1939" prominently displayed in white
- Website: "InsulationContractorsofArizona.com" at bottom

BADGES/ELEMENTS:
- "FREE ESTIMATES" badge in cyan/white
- "Licensed | Bonded | Insured" text
- BBB A+ rating mention if relevant

ABSOLUTELY DO NOT INCLUDE:
- Spray foam guns or application equipment
- People spraying or applying any insulation material
- Spray foam texture or foam being applied
- Any insulation installation in progress
- Hoses, tanks, or spraying equipment
- Chemical foam or expanding foam visuals

Generate a professional marketing advertisement that looks like a polished social media ad campaign image.'
)
WHERE LOWER(slug) = 'ica';

-- Verify the update
SELECT id, slug, name, image_config FROM brands WHERE LOWER(slug) = 'ica';
