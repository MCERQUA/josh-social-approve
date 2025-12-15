// Setup ICA (Insulation Contractors of Arizona) tenant and brand
// Chris Kuhn's account with OneUp category ID 29153
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function setupICA() {
  console.log('Setting up ICA (Insulation Contractors of Arizona)...\n');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. First, let's see current state
    console.log('\n1. Current database state:');
    const currentTenants = await sql`SELECT * FROM tenants`;
    console.log('   Tenants:', currentTenants.map(t => `${t.subdomain} (ID: ${t.id})`).join(', '));

    const currentBrands = await sql`SELECT * FROM brands`;
    console.log('   Brands:', currentBrands.map(b => `${b.slug} - ${b.name} (OneUp: ${b.oneup_category_id || 'none'})`).join(', '));

    // 2. Create Chris's tenant
    console.log('\n2. Creating tenant for Chris (ICA)...');
    const tenantResult = await sql`
      INSERT INTO tenants (subdomain, name, email, primary_color)
      VALUES ('icafoam', 'Chris Kuhn', 'chris@insulationcontractorsofarizona.com', '#00CED1')
      ON CONFLICT (subdomain) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        primary_color = EXCLUDED.primary_color
      RETURNING id, subdomain, name
    `;
    console.log('   ✓ Tenant created:', tenantResult[0]);
    const chrisTenantId = tenantResult[0].id;

    // 3. Create ICA brand with OneUp category
    console.log('\n3. Creating ICA brand with OneUp category ID 29153...');
    const brandResult = await sql`
      INSERT INTO brands (
        slug,
        name,
        short_name,
        oneup_category_id,
        color,
        website_url,
        tenant_id
      )
      VALUES (
        'ica',
        'Insulation Contractors of Arizona',
        'ICA',
        29153,
        'cyan',
        'https://insulationcontractorsofarizona.com',
        ${chrisTenantId}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        oneup_category_id = EXCLUDED.oneup_category_id,
        website_url = EXCLUDED.website_url,
        tenant_id = EXCLUDED.tenant_id
      RETURNING id, slug, name, oneup_category_id
    `;
    console.log('   ✓ Brand created:', brandResult[0]);

    // 4. Verify final state
    console.log('\n4. Verifying setup...');
    const allTenants = await sql`SELECT * FROM tenants ORDER BY id`;
    const allBrands = await sql`
      SELECT b.*, t.subdomain as tenant_subdomain, t.name as tenant_name
      FROM brands b
      LEFT JOIN tenants t ON b.tenant_id = t.id
      ORDER BY b.id
    `;

    console.log('\n   All Tenants:');
    allTenants.forEach(t => {
      console.log(`   - ${t.subdomain}.jamsocial.app → ${t.name} (${t.email || 'no email'})`);
    });

    console.log('\n   All Brands:');
    allBrands.forEach(b => {
      console.log(`   - ${b.slug}: ${b.name}`);
      console.log(`     OneUp Category ID: ${b.oneup_category_id || 'NOT SET'}`);
      console.log(`     Website: ${b.website_url || 'none'}`);
      console.log(`     Tenant: ${b.tenant_subdomain || 'none'} (${b.tenant_name || 'unassigned'})`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ICA SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n  Chris can now access: https://icafoam.jamsocial.app');
    console.log('  OneUp Category ID: 29153');
    console.log('  Brand slug: ica');
    console.log('\n  Next: Add ICA posts to the database for scheduling');

  } catch (error) {
    console.error('\nSetup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

setupICA();
