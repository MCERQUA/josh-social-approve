// Check current database schema for posts
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function checkSchema() {
  console.log('Checking database schema...\n');

  try {
    // Get posts table columns
    console.log('Posts table columns:');
    const postsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `;
    console.log('───────────────────────────────────────');
    postsColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });

    // Get approvals table columns
    console.log('\nApprovals table columns:');
    console.log('───────────────────────────────────────');
    const approvalsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'approvals'
      ORDER BY ordinal_position
    `;
    approvalsColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });

    // Count posts by brand
    console.log('\nPosts count by brand:');
    console.log('───────────────────────────────────────');
    const counts = await sql`
      SELECT b.slug, b.name, COUNT(p.id) as post_count
      FROM brands b
      LEFT JOIN posts p ON p.brand_id = b.id
      GROUP BY b.id, b.slug, b.name
    `;
    counts.forEach(c => {
      console.log(`  ${c.slug} (${c.name}): ${c.post_count} posts`);
    });

    // Sample CCA post to see structure
    console.log('\nSample CCA post structure:');
    console.log('───────────────────────────────────────');
    const sample = await sql`
      SELECT p.*, a.status as approval_status, a.scheduled_for, a.scheduled_status
      FROM posts p
      LEFT JOIN approvals a ON a.post_id = p.id
      WHERE p.brand_id = 1
      LIMIT 1
    `;
    if (sample[0]) {
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
