// Run the scheduling migration
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function runMigration() {
  console.log('Running scheduling migration...\n');

  try {
    // Add scheduling columns to approvals table
    console.log('1. Adding scheduling columns to approvals table...');
    await sql`
      ALTER TABLE approvals
      ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
      ADD COLUMN IF NOT EXISTS scheduled_status VARCHAR(20) DEFAULT 'not_scheduled',
      ADD COLUMN IF NOT EXISTS oneup_post_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS oneup_category_id INTEGER,
      ADD COLUMN IF NOT EXISTS target_platforms JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS publish_error TEXT,
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMP
    `;
    console.log('   ✓ Columns added\n');

    // Create index for scheduled posts queries
    console.log('2. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_approvals_scheduled_for ON approvals(scheduled_for)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_approvals_scheduled_status ON approvals(scheduled_status)`;
    console.log('   ✓ Indexes created\n');

    // Create scheduling_history table
    console.log('3. Creating scheduling_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS scheduling_history (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        scheduled_for TIMESTAMP,
        platforms JSONB,
        oneup_response JSONB,
        error_message TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_scheduling_history_post_id ON scheduling_history(post_id)`;
    console.log('   ✓ Table created\n');

    // Create oneup_categories table
    console.log('4. Creating oneup_categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS oneup_categories (
        id SERIAL PRIMARY KEY,
        oneup_category_id INTEGER NOT NULL UNIQUE,
        category_name VARCHAR(255) NOT NULL,
        accounts JSONB DEFAULT '[]',
        last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✓ Table created\n');

    // Update existing approvals to have default scheduled_status
    console.log('5. Setting default scheduled_status for existing records...');
    await sql`
      UPDATE approvals
      SET scheduled_status = 'not_scheduled'
      WHERE scheduled_status IS NULL
    `;
    console.log('   ✓ Existing records updated\n');

    console.log('═══════════════════════════════════════');
    console.log('  Migration completed successfully!');
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
