#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'social-approve-app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1];

const { Client } = require('pg');

// Map database titles to REAL blog URLs (verified from contractorschoiceagency.com/blog)
const REAL_BLOG_URLS = {
  // State-specific contractor insurance guides
  'Alabama Contractor Insurance Guide: Beyond Workers Comp to Full Coverage 2025': '/blog/alabama-contractor-insurance-guide-beyond-workers-comp-to-full-coverage-2025',
  'Arizona Contractor Insurance Guide': '/blog/arizona-contractor-insurance-guide',
  'Florida Contractor Insurance Guide': '/blog/florida-contractor-insurance-guide',
  'Hawaii Contractor Insurance Guide': '/blog/hawaii-contractor-insurance-guide',
  'Illinois Contractor Insurance Guide: Beyond Bonds to Full Coverage 2025': '/blog/illinois-contractor-insurance-guide-beyond-bonds-to-full-coverage-2025',
  'Kansas Contractor Insurance Guide': '/blog/kansas-contractor-insurance-guide',
  'Kentucky Contractor Insurance Guide': '/blog/kentucky-contractor-insurance-guide',
  'Louisiana Contractor Insurance Guide: Requirements, Costs & Coverage 2025': '/blog/louisiana-contractor-insurance-guide-requirements-costs-coverage-2025',
  'Michigan Contractor Insurance Guide': '/blog/michigan-contractor-insurance-guide',
  'Minnesota Contractor Insurance Guide': '/blog/minnesota-contractor-insurance-guide',
  'Mississippi Contractor Insurance Guide: Requirements, Costs, and Coverage Options 2025': '/blog/mississippi-contractor-insurance-guide-requirements-costs-and-coverage-options-2025',
  'Nevada Contractor Insurance Guide': '/blog/nevada-contractor-insurance-guide',
  'New Jersey Contractor Insurance Guide': '/blog/new-jersey-contractor-insurance-guide',
  'New York Contractor Insurance Guide': '/blog/new-york-contractor-insurance-guide',
  'North Carolina Contractor Insurance Guide: Comprehensive Requirements & Coverage for 2025': '/blog/north-carolina-contractor-insurance-guide-comprehensive-requirements-coverage-2025',
  'PA Contractor Insurance: Complete Requirements & Cost Guide 2025': '/blog/pennsylvania-contractor-insurance-guide',
  'Texas Contractor Insurance Guide': '/blog/2024/06/21/texas-contractor-insurance-guide',
  'Utah Contractor Insurance Guide': '/blog/utah-contractor-insurance-guide',
  'Vermont Contractor Insurance & Act 250 Compliance': '/blog/vermont-contractor-insurance-guide-registration-act-250-compliance-2024',

  // Roofing specific
  'Arkansas Roofing Contractor License Bond Requirements and Costs 2025': '/blog/arkansas-roofing-contractor-license-bond-requirements-and-costs',
  'California General Liability Insurance for Roofers': '/blog/california-roofer-general-liability-insurance-requirements',
  'Georgia Commercial Auto Insurance for Roofing Companies': '/blog/georgia-commercial-auto-insurance-for-roofing-companies',
  'Hawaii Commercial Auto Insurance for Roofing Companies': '/blog/hawaii-commercial-auto-insurance-for-roofing-companies',
  'Kentucky Roofing Insurance Complete Guide 2025': '/blog/kentucky-roofing-insurance-complete-guide-2025',
  'Louisiana General Liability Insurance Requirements for Roofers': '/blog/louisiana-general-liability-insurance-requirements-for-roofers',
  'Montana Personal vs Commercial Auto Insurance: What Roofers Need to Know': '/blog/montana-personal-vs-commercial-auto-insurance-what-roofers-need-to-know',
  'Wyoming Workers\' Compensation for Roofing Contractors: Complete 2025 Guide': '/blog/wyoming-workers-compensation-for-roofing-contractors',
  'Why Roofing Contractors Need Commercial Auto Insurance': '/blog/why-roofing-contractors-need-commercial-auto-insurance',

  // Workers Compensation
  'California Workers Comp Violations Cost Contractors $50,000+ (Avoid These Traps)': '/blog/california-workers-compensation-requirements',
  'Florida Workers Comp Exemptions: The $437,000 Mistake That Destroyed a Roofing Company': '/blog/florida-workers-compensation-requirements',
  'General Contractors and Workers\' Comp': '/blog/general-contractors-and-workers-comp',
  'History of Workers\' Compensation': '/blog/history-of-workers-compensation',
  'Pennsylvania Workers Comp: Why Fund vs Private Insurance Choice Bankrupts Contractors': '/blog/pennsylvania-workers-compensation-requirements',
  'Workers Compensation Ghost Policy: Complete Guide for Contractors in 2025': '/blog/workers-compensation-ghost-policy',
  'Workers Compensation Insurance Complete Guide': '/blog/workers-compensation-complete-guide',

  // Commercial Auto
  'Commercial Auto Insurance Basics for Contractors': '/blog/the-basics-of-commercial-auto-insurance',
  'Commercial Auto Insurance for Contractors': '/blog/commercial-auto-insurance-contractors',
  'Florida Commercial Auto Insurance: The Hurricane Scam That Cost a Contractor $4.2 Million': '/blog/florida-commercial-auto-requirements',
  'Florida Personal vs Commercial Auto: The $100,000 Mistake Contractors Make': '/blog/florida-personal-vs-commercial-auto',
  'Hidden Costs in Commercial Auto Insurance for Contractors': '/blog/the-hidden-costs-in-your-commercial-auto-insurance-policy',
  'New York Commercial Auto Insurance: NYC TLC Requirements That Bankrupt Contractors': '/blog/new-york-commercial-auto-requirements',
  'New York Personal vs Commercial Auto: The $2.5 Million Empire State Compliance Trap': '/blog/new-york-personal-vs-commercial-auto',
  'Texas Commercial Auto Insurance Mistakes That Trigger $15,000 DOT Violations': '/blog/texas-commercial-auto-requirements',
  'Texas Personal vs Commercial Auto: The $2.3 Million Mistake That Bankrupted a Plumber': '/blog/texas-personal-vs-commercial-auto',

  // Ghost Policies
  'Ghost Insurance for Contractors: Complete Coverage Guide 2025': '/blog/ghost-insurance-for-contractors',

  // Certificates and Claims
  'Certificate of Insurance Requirements for Contractors': '/blog/certificate-of-insurance-requirements-for-contractors',
  'COI Mistakes That Cost Contractors $25,000+ Annually (Avoid These 7 Deadly Errors)': '/blog/coi-mistakes-that-cost-contractors-25000-avoid-these-7-deadly-errors',
  'Contractor Insurance Claim Management: Complete Guide to Protecting Your Business': '/blog/contractor-insurance-claim-management-guide',
  'Holder Certificate for Construction Projects: Complete Guide 2025': '/blog/holder-certificate-construction-projects-guide',
  'How Insurance Claims Impact Your Future Premiums': '/blog/impact-of-claims-on-future-premiums',

  // Professional Liability and Other
  'Professional Liability Insurance for Contractors: Errors & Omissions Protection 2025': '/blog/professional-liability-insurance-for-contractors',
  'Subcontractor Insurance Requirements: Complete Coverage Guide': '/blog/subcontractor-insurance-requirements-complete-coverage-guide',
  'Reservation of Rights Letter: What Contractors Need to Know When Insurance Coverage is Uncertain 2025': '/blog/reservation-of-rights-letter-what-contractors-need-to-know-when-insurance-coverage-is-uncertain-2025',

  // City-specific
  'Philadelphia Business Insurance: Local Requirements & Costs': '/blog/philadelphia-business-insurance-local-requirements-costs',
  'Pittsburgh Business Insurance: Requirements & Coverage Guide': '/blog/pittsburgh-business-insurance-requirements-coverage-guide',

  // Insurance fundamentals
  'Discounts and Savings Opportunities: Maximizing Your Insurance Value': '/blog/discounts-and-savings-opportunities',
  'Navigating Insurance Renewals and Policy Changes': '/blog/navigating-insurance-renewals-and-policy-changes',
  'Roof Coverage: ACV vs Replacement Cost': '/blog/roof-coverage-acv-vs-replacement-cost',
  'The True Cost of Skimping on Coverage': '/blog/the-true-cost-of-skimping-on-coverage'
};

async function fixRealUrls() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all unique posts
    const result = await client.query(`
      SELECT DISTINCT title
      FROM posts
      ORDER BY title
    `);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundTitles = [];

    console.log('📝 Updating posts with REAL blog URLs...\n');

    for (const row of result.rows) {
      const title = row.title;
      const blogUrl = REAL_BLOG_URLS[title];

      if (blogUrl) {
        const fullUrl = `https://contractorschoiceagency.com${blogUrl}`;

        // Update all posts with this title (both Facebook and Google versions)
        await client.query(`
          UPDATE posts
          SET content = REGEXP_REPLACE(
            content,
            'https://contractorschoiceagency\.com/blog/[^\\s]+',
            $1,
            'g'
          )
          WHERE title = $2
        `, [fullUrl, title]);

        updatedCount++;
        console.log(`✅ ${title}`);
        console.log(`   → ${fullUrl}\n`);
      } else {
        notFoundCount++;
        notFoundTitles.push(title);
        console.log(`❌ NOT FOUND: ${title}\n`);
      }
    }

    console.log('='.repeat(80));
    console.log(`\n✅ Updated ${updatedCount} posts with REAL URLs`);
    console.log(`❌ ${notFoundCount} posts have no matching blog article\n`);

    if (notFoundTitles.length > 0) {
      console.log('⚠️  Posts without matching blog articles:');
      notFoundTitles.forEach(title => {
        console.log(`   - ${title}`);
      });
      console.log('\nThese posts should either:');
      console.log('1. Be deleted from the database (if no blog article exists)');
      console.log('2. Have their titles updated to match existing blog articles');
      console.log('3. Have blog articles created for them\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixRealUrls();
