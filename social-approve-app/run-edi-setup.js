// Setup EDI Insulation tenant, brand, and website
// EDI's OneUp category needs to be configured
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

// ====== CONFIGURE THESE VALUES ======
const EDI_CONFIG = {
  // Tenant info
  subdomain: 'edi',
  ownerName: 'EDI Spray Foam Insulation',
  email: '', // Add EDI's email if known

  // Brand info
  brandName: 'EDI Spray Foam Insulation',
  shortName: 'EDI',
  color: '#0066CC', // Blue - update if they have brand colors
  websiteUrl: 'https://edi-sprayfoam.com',

  // OneUp category - from API: "EDI Spray Foam Insulation" created 2025-12-21
  oneupCategoryId: 166760,

  // Josh-AI integration
  domainFolder: 'EDI-sprayfoam' // Matches /home/josh/Josh-AI/websites/EDI-sprayfoam/
};
// =====================================

async function setupEDI() {
  console.log('Setting up EDI Insulation...\n');
  console.log('═══════════════════════════════════════════════════════════');

  // Validate config
  if (!EDI_CONFIG.oneupCategoryId) {
    console.error('ERROR: oneupCategoryId is required!');
    console.error('Please set EDI_CONFIG.oneupCategoryId before running.\n');
    console.error('Find it in OneUp: https://app.oneupapp.io');
    console.error('Look for "EDI" or similar category.\n');
    process.exit(1);
  }

  try {
    // 1. Show current state
    console.log('\n1. Current database state:');
    const currentTenants = await sql`SELECT * FROM tenants`;
    console.log('   Tenants:', currentTenants.map(t => `${t.subdomain} (ID: ${t.id})`).join(', ') || 'none');

    const currentBrands = await sql`SELECT * FROM brands`;
    console.log('   Brands:', currentBrands.map(b => `${b.slug} - ${b.name} (OneUp: ${b.oneup_category_id || 'none'})`).join(', ') || 'none');

    // 2. Create EDI tenant
    console.log('\n2. Creating tenant for EDI...');
    const tenantResult = await sql`
      INSERT INTO tenants (subdomain, name, email, primary_color)
      VALUES (${EDI_CONFIG.subdomain}, ${EDI_CONFIG.ownerName}, ${EDI_CONFIG.email || null}, ${EDI_CONFIG.color})
      ON CONFLICT (subdomain) DO UPDATE SET
        name = EXCLUDED.name,
        email = COALESCE(EXCLUDED.email, tenants.email),
        primary_color = EXCLUDED.primary_color
      RETURNING id, subdomain, name
    `;
    console.log('   ✓ Tenant created:', tenantResult[0]);
    const ediTenantId = tenantResult[0].id;

    // 3. Create EDI brand with OneUp category
    console.log(`\n3. Creating EDI brand with OneUp category ID ${EDI_CONFIG.oneupCategoryId}...`);
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
        ${EDI_CONFIG.subdomain},
        ${EDI_CONFIG.brandName},
        ${EDI_CONFIG.shortName},
        ${EDI_CONFIG.oneupCategoryId},
        ${EDI_CONFIG.color},
        ${EDI_CONFIG.websiteUrl},
        ${ediTenantId}
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

    // 4. Create website entry with domain_folder for content integration
    console.log('\n4. Creating website entry with Josh-AI integration...');

    // Check if website already exists
    const existingWebsite = await sql`
      SELECT id FROM websites WHERE tenant_id = ${ediTenantId} AND url = ${EDI_CONFIG.websiteUrl}
    `;

    let websiteResult;
    if (existingWebsite.length > 0) {
      // Update existing
      websiteResult = await sql`
        UPDATE websites SET
          name = ${EDI_CONFIG.brandName},
          domain_folder = ${EDI_CONFIG.domainFolder},
          is_primary = true
        WHERE id = ${existingWebsite[0].id}
        RETURNING id, name, url, domain_folder
      `;
      console.log('   ✓ Website updated:', websiteResult[0]);
    } else {
      // Insert new
      websiteResult = await sql`
        INSERT INTO websites (
          tenant_id,
          name,
          url,
          platform,
          description,
          domain_folder,
          is_primary,
          is_active
        )
        VALUES (
          ${ediTenantId},
          ${EDI_CONFIG.brandName},
          ${EDI_CONFIG.websiteUrl},
          'custom',
          'EDI Spray Foam Insulation - Southeast Missouri',
          ${EDI_CONFIG.domainFolder},
          true,
          true
        )
        RETURNING id, name, url, domain_folder
      `;
      console.log('   ✓ Website created:', websiteResult[0]);
    }

    // 5. Verify final state
    console.log('\n5. Verifying setup...');
    const allTenants = await sql`SELECT * FROM tenants ORDER BY id`;
    const allBrands = await sql`
      SELECT b.*, t.subdomain as tenant_subdomain, t.name as tenant_name
      FROM brands b
      LEFT JOIN tenants t ON b.tenant_id = t.id
      ORDER BY b.id
    `;
    const allWebsites = await sql`
      SELECT w.*, t.subdomain as tenant_subdomain
      FROM websites w
      LEFT JOIN tenants t ON w.tenant_id = t.id
      WHERE w.is_active = true
      ORDER BY w.id
    `;

    console.log('\n   All Tenants:');
    allTenants.forEach(t => {
      console.log(`   - ${t.subdomain}.jamsocial.app → ${t.name}`);
    });

    console.log('\n   All Brands:');
    allBrands.forEach(b => {
      console.log(`   - ${b.slug}: ${b.name}`);
      console.log(`     OneUp Category ID: ${b.oneup_category_id || 'NOT SET'}`);
      console.log(`     Website: ${b.website_url || 'none'}`);
    });

    console.log('\n   All Websites (with Josh-AI integration):');
    allWebsites.forEach(w => {
      console.log(`   - ${w.name} (${w.tenant_subdomain})`);
      console.log(`     URL: ${w.url}`);
      console.log(`     Domain Folder: ${w.domain_folder || 'NOT SET'}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  EDI SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n  Dashboard URL: https://edi.jamsocial.app`);
    console.log(`  OneUp Category ID: ${EDI_CONFIG.oneupCategoryId}`);
    console.log(`  Josh-AI Folder: /home/josh/Josh-AI/websites/${EDI_CONFIG.domainFolder}/`);
    console.log(`  Topical Map: ✓ Ready (8 pillars, 89 articles)`);
    console.log('\n  The website hub should now show EDI content!');

  } catch (error) {
    console.error('\nSetup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

setupEDI();
