import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

async function checkPosts() {
  const result = await sql`SELECT id, title, post_index FROM posts ORDER BY post_index ASC`;
  console.log('Total posts:', result.length);
  for (const p of result) {
    console.log(`${p.id}|${p.post_index}|${p.title}`);
  }
}
checkPosts();
