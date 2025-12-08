import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

const imageUpdates = [
  // COI & Certificate Posts
  { title: 'The 45% Rejection Rate', image: 'coi-45-percent-rejection-rate-social.png' },
  { title: 'The Additional Insured Trap', image: 'additional-insured-trap-social.png' },
  { title: 'The Waiver of Subrogation Secret', image: 'waiver-subrogation-secret-social.png' },
  { title: 'The $8,500 Endorsement Error', image: 'endorsement-error-8500-social.png' },
  { title: 'The Primary vs Excess Coverage Confusion', image: 'primary-vs-excess-coverage-social.png' },
  { title: 'The Blanket vs Scheduled Mistake', image: 'blanket-vs-scheduled-coverage-social.png' },
  { title: 'The Operations Completed Gap', image: 'operations-completed-gap-social.png' },

  // Commercial Auto Posts
  { title: 'The Personal Auto Myth', image: 'personal-auto-myth-social.png' },
  { title: 'The DOT Violation Surprise', image: 'dot-violation-surprise-social.png' },
  { title: 'The Employee Personal Vehicle Risk', image: 'employee-personal-vehicle-risk-social.png' },
  { title: 'The Radius Restriction Trap', image: 'radius-restriction-trap-social.png' },
  { title: 'The Tool Theft Coverage Myth', image: 'tool-theft-coverage-myth-social.png' },

  // Workers Comp State Posts
  { title: 'The California $50,000 Trap', image: 'california-50000-trap-social.png' },
  { title: 'The Pennsylvania Fund vs Private Decision', image: 'pennsylvania-fund-vs-private-social.png' },

  // Utah guide
  { title: 'Utah Contractor Insurance Guide', image: 'utah-contractor-insurance-social.png' },
];

// Michigan has separate images per platform
const michiganUpdates = [
  { title: 'Michigan Contractor Insurance Guide', platform: 'facebook', image: 'michigan-contractor-insurance-facebook-social.png' },
  { title: 'Michigan Contractor Insurance Guide', platform: 'google_business', image: 'michigan-contractor-insurance-google-social.png' },
];

async function updateImages() {
  console.log('Updating image filenames in database...\n');

  let updated = 0;
  let notFound = 0;

  // Update standard posts (same image for both platforms)
  for (const update of imageUpdates) {
    try {
      const result = await sql`
        UPDATE posts
        SET image_filename = ${update.image}
        WHERE title = ${update.title}
        RETURNING id, title, platform
      `;

      if (result.length > 0) {
        console.log(`✓ Updated "${update.title}" (${result.length} posts) -> ${update.image}`);
        updated += result.length;
      } else {
        console.log(`✗ No posts found for: "${update.title}"`);
        notFound++;
      }
    } catch (error) {
      console.error(`Error updating "${update.title}":`, error);
    }
  }

  // Update Michigan posts (different images per platform)
  for (const update of michiganUpdates) {
    try {
      const result = await sql`
        UPDATE posts
        SET image_filename = ${update.image}
        WHERE title = ${update.title} AND platform = ${update.platform}
        RETURNING id, title, platform
      `;

      if (result.length > 0) {
        console.log(`✓ Updated "${update.title}" (${update.platform}) -> ${update.image}`);
        updated += result.length;
      } else {
        console.log(`✗ No posts found for: "${update.title}" (${update.platform})`);
        notFound++;
      }
    } catch (error) {
      console.error(`Error updating "${update.title}" (${update.platform}):`, error);
    }
  }

  console.log(`\n-----------------------------------------`);
  console.log(`Updated: ${updated} posts`);
  console.log(`Not found: ${notFound} titles`);

  // Show current state
  console.log(`\nVerifying social images in database:`);
  const socialPosts = await sql`
    SELECT title, platform, image_filename
    FROM posts
    WHERE image_filename LIKE '%-social.png'
    ORDER BY title, platform
  `;

  console.log(`Found ${socialPosts.length} posts with -social.png images\n`);
  socialPosts.forEach(p => {
    console.log(`  ${p.title} (${p.platform}): ${p.image_filename}`);
  });
}

updateImages().catch(console.error);
