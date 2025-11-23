#!/usr/bin/env node

/**
 * Apply database updates from update-all-posts.sql
 * This script connects to the Neon PostgreSQL database and applies all post updates
 */

const fs = require('fs');
const path = require('path');

// Read database URL from .env.local
const envPath = path.join(__dirname, 'social-approve-app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error('❌ Could not find DATABASE_URL in .env.local');
  process.exit(1);
}

const DATABASE_URL = dbUrlMatch[1];

// Read SQL file
const sqlPath = path.join(__dirname, 'update-all-posts.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('🔄 Installing pg library...');
const { execSync } = require('child_process');

try {
  execSync('npm install pg --no-save', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('❌ Failed to install pg library');
  process.exit(1);
}

const { Client } = require('pg');

async function applyUpdates() {
  console.log('\n📊 Connecting to Neon PostgreSQL database...');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🗑️  Clearing existing posts and approvals...');
    console.log('📝 Inserting all 106 posts with correct images and URLs...');
    console.log('⏳ This may take a moment...\n');

    // Execute the SQL
    await client.query(sqlContent);

    console.log('✅ Database updated successfully!\n');

    // Verify the updates
    console.log('🔍 Verifying updates...');

    const countResult = await client.query('SELECT COUNT(*) FROM posts');
    const postCount = parseInt(countResult.rows[0].count);

    const platformResult = await client.query(
      'SELECT platform, COUNT(*) FROM posts GROUP BY platform ORDER BY platform'
    );

    const sampleResult = await client.query(
      'SELECT id, post_index, title, platform, image_filename FROM posts ORDER BY post_index LIMIT 5'
    );

    console.log(`\n📊 Total posts: ${postCount}`);
    console.log('\n📊 Posts by platform:');
    platformResult.rows.forEach(row => {
      console.log(`   ${row.platform}: ${row.count}`);
    });

    console.log('\n📝 Sample posts:');
    sampleResult.rows.forEach(row => {
      console.log(`   [${row.post_index}] ${row.title} (${row.platform})`);
      console.log(`       Image: ${row.image_filename}\n`);
    });

    if (postCount === 106) {
      console.log('✅ SUCCESS! All 106 posts updated correctly!\n');
      console.log('🎉 Your website should now show all posts with correct images and clickable links!\n');
    } else {
      console.log(`⚠️  Warning: Expected 106 posts but found ${postCount}\n`);
    }

  } catch (error) {
    console.error('❌ Error applying updates:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

applyUpdates();
