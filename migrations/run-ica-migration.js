#!/usr/bin/env node
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_M1KCzjnGhgL5@ep-billowing-union-ahca6j30-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function runMigration() {
  const sql = neon(DATABASE_URL);

  console.log('Updating ICA brand with advertisement-style image template...\n');

  try {
    // First check current state
    console.log('1. Current ICA brand config:');
    const before = await sql`
      SELECT id, slug, name, image_config FROM brands WHERE LOWER(slug) = 'ica'
    `;
    if (before.length > 0) {
      console.log('   ID:', before[0].id);
      console.log('   Slug:', before[0].slug);
      console.log('   Name:', before[0].name);
      console.log('   Current config:', JSON.stringify(before[0].image_config, null, 2).substring(0, 200) + '...\n');
    } else {
      console.log('   No ICA brand found!\n');
      return;
    }

    // Update ICA brand config
    console.log('2. Updating image_config with branded ad template...');

    const imageConfig = {
      primaryColor: '#00CED1',
      secondaryColor: '#000000',
      backgroundColor: '#000000',
      logoPath: '/clients/ICA/Company-Images/Insulation_Contractors_Logo_V3.png',
      logoPosition: 'top-left',
      industry: 'insulation contractors',
      tagline: "Arizona's Extreme Heat Specialists",
      phone: '623-241-1939',
      website: 'InsulationContractorsofArizona.com',
      styleDescription: `DESIGN LAYOUT for ICA - Insulation Contractors of Arizona branded social media advertisement:

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

Generate a professional marketing advertisement that looks like a polished social media ad campaign image.`
    };

    await sql`
      UPDATE brands
      SET image_config = ${JSON.stringify(imageConfig)}::jsonb
      WHERE LOWER(slug) = 'ica'
    `;
    console.log('   Done.\n');

    // Verify update
    console.log('3. Verifying update:');
    const after = await sql`
      SELECT id, slug, name, image_config FROM brands WHERE LOWER(slug) = 'ica'
    `;
    if (after.length > 0 && after[0].image_config) {
      const config = after[0].image_config;
      console.log('   Primary Color:', config.primaryColor);
      console.log('   Secondary Color:', config.secondaryColor);
      console.log('   Logo Path:', config.logoPath);
      console.log('   Phone:', config.phone);
      console.log('   Website:', config.website);
      console.log('   Has TEXT TO INCLUDE:', config.styleDescription?.includes('TEXT TO INCLUDE') ? 'YES' : 'NO');
      console.log('   Has DESIGN LAYOUT:', config.styleDescription?.includes('DESIGN LAYOUT') ? 'YES' : 'NO');
    }

    console.log('\nMigration completed successfully!');
    console.log('\nNOTE: New images generated for ICA will now use the branded ad template style.');
    console.log('      Existing images will not be affected - regenerate them to use the new style.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
