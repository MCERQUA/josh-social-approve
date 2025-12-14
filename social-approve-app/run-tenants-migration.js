// Create tenants table and add tenant_id to brands for multi-tenant support
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function runMigration() {
  console.log('Running multi-tenant migration...\n');

  try {
    // 1. Create tenants table
    console.log('1. Creating tenants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        subdomain VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        clerk_user_id VARCHAR(255),
        logo_url VARCHAR(500),
        primary_color VARCHAR(20) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✓ Tenants table created\n');

    // 2. Insert Josh as the first tenant
    console.log('2. Inserting Josh tenant...');
    await sql`
      INSERT INTO tenants (subdomain, name, email, primary_color)
      VALUES ('josh', 'Josh Cotner', 'josh@contractorschoiceagency.com', '#F97316')
      ON CONFLICT (subdomain) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email
      RETURNING id
    `;
    console.log('   ✓ Josh tenant inserted\n');

    // 3. Get Josh's tenant ID
    const joshTenant = await sql`SELECT id FROM tenants WHERE subdomain = 'josh'`;
    const joshTenantId = joshTenant[0].id;
    console.log('   Josh tenant ID:', joshTenantId, '\n');

    // 4. Add tenant_id column to brands table
    console.log('3. Adding tenant_id to brands table...');
    await sql`
      ALTER TABLE brands
      ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id)
    `;
    console.log('   ✓ tenant_id column added\n');

    // 5. Assign all existing brands to Josh
    console.log('4. Assigning existing brands to Josh...');
    await sql`
      UPDATE brands SET tenant_id = ${joshTenantId} WHERE tenant_id IS NULL
    `;
    console.log('   ✓ Brands assigned to Josh\n');

    // 6. Create indexes
    console.log('5. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tenants_clerk_user_id ON tenants(clerk_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id)`;
    console.log('   ✓ Indexes created\n');

    // 7. Verify setup
    console.log('6. Verifying setup...');
    const tenants = await sql`SELECT * FROM tenants`;
    const brands = await sql`SELECT b.*, t.subdomain as tenant_subdomain FROM brands b LEFT JOIN tenants t ON b.tenant_id = t.id`;

    console.log('\n   Tenants:');
    tenants.forEach(t => console.log(`   - ${t.subdomain}: ${t.name}`));

    console.log('\n   Brands:');
    brands.forEach(b => console.log(`   - ${b.slug}: ${b.name} (tenant: ${b.tenant_subdomain})`));

    console.log('\n═══════════════════════════════════════');
    console.log('  Multi-tenant migration completed!');
    console.log('═══════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Configure Netlify wildcard subdomain');
    console.log('2. Add subdomain detection middleware');
    console.log('3. Update API routes to filter by tenant');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
