import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('Running migration 005-image-deploy-status...');

  try {
    // Add columns
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_deploy_status VARCHAR(20) DEFAULT 'none'`;
    console.log('✓ Added image_deploy_status column');

    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_commit_sha VARCHAR(64)`;
    console.log('✓ Added image_commit_sha column');

    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_error TEXT`;
    console.log('✓ Added image_error column');

    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_generated_at TIMESTAMP`;
    console.log('✓ Added image_generated_at column');

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_image_deploy_status ON posts(image_deploy_status)`;
    console.log('✓ Created index');

    // Update existing posts
    const result = await sql`
      UPDATE posts
      SET image_deploy_status = 'deployed'
      WHERE image_filename IS NOT NULL
        AND image_filename != ''
        AND (image_deploy_status IS NULL OR image_deploy_status = 'none')
      RETURNING id
    `;
    console.log(`✓ Updated ${result.length} existing posts to 'deployed' status`);

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
