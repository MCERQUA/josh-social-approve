require('dotenv').config({ path: './social-approve-app/.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function checkPosts() {
  const posts = await sql`
    SELECT id, post_index, title, LEFT(content, 80) as content_preview, image_filename, platform
    FROM posts
    ORDER BY post_index ASC
  `;

  console.log('Total posts:', posts.length);
  console.log('\n');

  posts.forEach((post, i) => {
    console.log(`${i + 1}. Post Index: ${post.post_index}, Image: ${post.image_filename}`);
    console.log(`   Title: ${post.title}`);
    console.log(`   Content: ${post.content_preview}...`);
    console.log('');
  });
}

checkPosts().catch(console.error);
