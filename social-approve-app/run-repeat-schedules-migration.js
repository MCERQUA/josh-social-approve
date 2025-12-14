const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

  if (!databaseUrl) {
    // Try to read from .env.local
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL="([^"]+)"/);
      if (match) {
        process.env.DATABASE_URL = match[1];
      }
    }
  }

  const sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);

  console.log('Running repeat schedules migration...\n');

  try {
    // Read and execute migration
    const migrationPath = path.join(__dirname, 'migrations', '004-repeat-schedules.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons but be careful with function definitions
    const statements = migrationSql
      .split(/;(?=\s*(?:CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|COMMENT|$))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          // Extract first line for logging
          const firstLine = statement.split('\n')[0].substring(0, 60);
          console.log(`✓ ${firstLine}...`);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists')) {
            const firstLine = statement.split('\n')[0].substring(0, 60);
            console.log(`○ ${firstLine}... (already exists)`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

    // Verify tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('post_schedules', 'schedule_instances')
    `;

    console.log('\nVerified tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
