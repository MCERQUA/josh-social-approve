#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'social-approve-app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1];

const { Client } = require('pg');

async function verifyAllPosts() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    // Get ALL posts
    const result = await client.query(
      'SELECT post_index, title, platform, image_filename, LEFT(content, 100) as content_preview FROM posts ORDER BY post_index'
    );

    console.log(`\n📊 TOTAL POSTS IN DATABASE: ${result.rows.length}\n`);

    if (result.rows.length !== 106) {
      console.error(`❌ ERROR: Expected 106 posts but found ${result.rows.length}!`);
      process.exit(1);
    }

    console.log('✅ All 106 posts confirmed in database!\n');
    console.log('📋 COMPLETE LIST OF ALL POSTS:\n');

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. [${row.post_index}] ${row.title} (${row.platform})`);
      console.log(`   Image: ${row.image_filename}`);
      console.log(`   Content: ${row.content_preview}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyAllPosts();
