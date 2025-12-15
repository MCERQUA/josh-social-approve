// Create websites table for multi-tenant website management
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function runMigration() {
  console.log('Running websites migration...\n');

  try {
    // 1. Create websites table
    console.log('1. Creating websites table...');
    await sql`
      CREATE TABLE IF NOT EXISTS websites (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        platform VARCHAR(50) DEFAULT 'custom',
        description TEXT,
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   Websites table created\n');

    // 2. Create indexes
    console.log('2. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_websites_tenant_id ON websites(tenant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_websites_is_active ON websites(is_active)`;
    console.log('   Indexes created\n');

    // 3. Verify setup
    console.log('3. Verifying setup...');
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'websites'
    `;
    console.log('   Tables found:', tables.length > 0 ? 'websites' : 'none');

    // 4. List current tenants for reference
    const tenants = await sql`SELECT id, subdomain, name FROM tenants`;
    console.log('\n   Current tenants:');
    tenants.forEach(t => console.log(`   - [${t.id}] ${t.subdomain}: ${t.name}`));

    console.log('\n');
    console.log('  Websites migration completed!');
    console.log('');
    console.log('\nTo add a website, use:');
    console.log("INSERT INTO websites (tenant_id, name, url, platform) VALUES (1, 'My Site', 'https://example.com', 'netlify');");

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
