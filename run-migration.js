#!/usr/bin/env node
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_M1KCzjnGhgL5@ep-billowing-union-ahca6j30-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function runMigration() {
  const sql = neon(DATABASE_URL);

  console.log('Running migration: Add two-stage approval (text + image)...\n');

  try {
    // Add image_status column
    console.log('1. Adding image_status column...');
    await sql`
      ALTER TABLE approvals
      ADD COLUMN IF NOT EXISTS image_status VARCHAR(20) DEFAULT 'not_ready' CHECK (image_status IN ('not_ready', 'pending', 'approved', 'rejected'))
    `;
    console.log('   Done.');

    // Add image_rejection_reason column
    console.log('2. Adding image_rejection_reason column...');
    await sql`
      ALTER TABLE approvals
      ADD COLUMN IF NOT EXISTS image_rejection_reason TEXT
    `;
    console.log('   Done.');

    // Add image_reviewed_at column
    console.log('3. Adding image_reviewed_at column...');
    await sql`
      ALTER TABLE approvals
      ADD COLUMN IF NOT EXISTS image_reviewed_at TIMESTAMP
    `;
    console.log('   Done.');

    // Create index
    console.log('4. Creating index on image_status...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_approvals_image_status ON approvals(image_status)
    `;
    console.log('   Done.');

    // Update existing approved posts to have pending image status
    console.log('5. Updating existing approved posts to pending image status...');
    const result = await sql`
      UPDATE approvals
      SET image_status = 'pending'
      WHERE status = 'approved' AND (image_status IS NULL OR image_status = 'not_ready')
      RETURNING id
    `;
    console.log(`   Updated ${result.length} posts.`);

    // Show current state
    console.log('\n6. Current approval states:');
    const stats = await sql`
      SELECT
        status as text_status,
        image_status,
        COUNT(*) as count
      FROM approvals
      GROUP BY status, image_status
      ORDER BY status, image_status
    `;
    console.table(stats);

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
