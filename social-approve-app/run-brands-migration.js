// Create brands table and add brand_id to posts
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function runMigration() {
  console.log('Running brands migration...\n');

  try {
    // 1. Create brands table
    console.log('1. Creating brands table...');
    await sql`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(10),
        oneup_category_id INTEGER,
        color VARCHAR(20) DEFAULT 'orange',
        logo_url VARCHAR(500),
        website_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✓ Brands table created\n');

    // 2. Insert CCA as the first brand
    console.log('2. Inserting CCA brand...');
    await sql`
      INSERT INTO brands (slug, name, short_name, oneup_category_id, color, website_url)
      VALUES ('cca', 'Contractor''s Choice Agency', 'CCA', NULL, 'orange', 'https://contractorschoiceagency.com')
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        website_url = EXCLUDED.website_url
    `;
    console.log('   ✓ CCA brand inserted\n');

    // 3. Add brand_id column to posts table
    console.log('3. Adding brand_id to posts table...');
    await sql`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id)
    `;
    console.log('   ✓ brand_id column added\n');

    // 4. Get CCA brand ID
    const ccaBrand = await sql`SELECT id FROM brands WHERE slug = 'cca'`;
    const ccaId = ccaBrand[0].id;
    console.log('   CCA brand ID:', ccaId, '\n');

    // 5. Assign all existing posts to CCA
    console.log('4. Assigning existing posts to CCA...');
    const result = await sql`
      UPDATE posts SET brand_id = ${ccaId} WHERE brand_id IS NULL
    `;
    console.log('   ✓ Posts assigned to CCA\n');

    // 6. Create index
    console.log('5. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_brand_id ON posts(brand_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug)`;
    console.log('   ✓ Indexes created\n');

    console.log('═══════════════════════════════════════');
    console.log('  Brands migration completed!');
    console.log('═══════════════════════════════════════');
    console.log('\nNext: Set CCA\'s OneUp category ID');
    console.log('Run: node set-oneup-category.js cca <category_id>');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
