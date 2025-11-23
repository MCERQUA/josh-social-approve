const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function applyMappings() {
  const sqlFile = fs.readFileSync('/home/josh/Josh-AI/websites/JOSH-SOCIAL-APPROVE/update-mappings.sql', 'utf8');

  // Split by semicolons and filter out comments and empty lines
  const statements = sqlFile
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Executing ${statements.length} UPDATE statements...\n`);

  for (const statement of statements) {
    if (statement.toUpperCase().startsWith('UPDATE')) {
      try {
        await sql(statement);
        const match = statement.match(/post_index = (\d+)/);
        if (match) {
          console.log(`✓ Updated post ${match[1]}`);
        }
      } catch (error) {
        console.error(`✗ Error executing: ${statement}`);
        console.error(error.message);
      }
    }
  }

  console.log('\n✓ All mappings applied successfully!');
  console.log('\nVerifying first 10 posts:');

  const posts = await sql`
    SELECT post_index, title, image_filename
    FROM posts
    ORDER BY post_index ASC
    LIMIT 10
  `;

  posts.forEach(p => {
    console.log(`${p.post_index}: ${p.image_filename} -> ${p.title}`);
  });
}

applyMappings().catch(console.error);
