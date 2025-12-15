// Import ICA posts from JSON data file
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function importICAPosts() {
  console.log('Importing ICA posts...\n');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Load posts data from JSON
    const dataFile = path.join(__dirname, 'ica-posts-data.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`\nLoaded ${data.posts.length} posts from ica-posts-data.json`);

    // 2. Get ICA brand ID
    const brandResult = await sql`SELECT id FROM brands WHERE slug = ${data.brand_slug}`;
    if (!brandResult.length) {
      throw new Error(`Brand '${data.brand_slug}' not found. Run run-ica-setup.js first.`);
    }
    const brandId = brandResult[0].id;
    console.log(`Brand ID for '${data.brand_slug}': ${brandId}`);

    // 3. Get the next available post_index
    const maxIndexResult = await sql`SELECT COALESCE(MAX(post_index), -1) + 1 as next_index FROM posts`;
    let nextIndex = maxIndexResult[0].next_index;
    console.log(`Starting post_index: ${nextIndex}`);

    // 4. Import each post
    console.log('\nImporting posts:');
    console.log('───────────────────────────────────────────────────────────');

    let imported = 0;
    let skipped = 0;

    for (const post of data.posts) {
      // Check if this image already exists for this brand
      const existing = await sql`
        SELECT id FROM posts
        WHERE image_filename = ${post.image_filename}
        AND brand_id = ${brandId}
      `;

      if (existing.length > 0) {
        console.log(`  SKIP: ${post.image_filename} (already exists)`);
        skipped++;
        continue;
      }

      // Build image path (for display, actual file is in public folder)
      const imageFilename = `clients/ICA/social-posts/approved/${post.image_filename}`;

      // Insert the post
      const postResult = await sql`
        INSERT INTO posts (post_index, title, platform, content, image_filename, brand_id, image_deploy_status)
        VALUES (${nextIndex}, ${post.title}, ${post.platform}, ${post.content}, ${imageFilename}, ${brandId}, 'deployed')
        RETURNING id
      `;
      const postId = postResult[0].id;

      // Create approval record (pending)
      await sql`
        INSERT INTO approvals (post_id, status, image_status, scheduled_status, oneup_category_id)
        VALUES (${postId}, 'pending', 'not_ready', 'not_scheduled', 29153)
      `;

      console.log(`  ✓ Imported: ${post.title} (ID: ${postId}, Index: ${nextIndex})`);
      nextIndex++;
      imported++;
    }

    // 5. Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  IMPORT COMPLETE`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n  Imported: ${imported} posts`);
    console.log(`  Skipped:  ${skipped} posts (already exist)`);
    console.log(`  Total:    ${data.posts.length} posts in JSON file`);

    // 6. Verify by showing ICA posts count
    const countResult = await sql`
      SELECT COUNT(*) as count FROM posts WHERE brand_id = ${brandId}
    `;
    console.log(`\n  ICA now has ${countResult[0].count} posts in the database.`);

    console.log('\n  Next steps:');
    console.log('  1. Visit https://icafoam.jamsocial.app to see posts');
    console.log('  2. Approve text and images in the dashboard');
    console.log('  3. Schedule posts to OneUp calendar');

  } catch (error) {
    console.error('\nImport failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

importICAPosts();
