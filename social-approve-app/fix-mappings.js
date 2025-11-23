const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function fixMappings() {
  const mappings = [
    // California HVAC (Posts 0-1)
    [0, 'CCA-_0053_Layer-1.png'],
    [1, 'CCA-_0007_Layer-47.png'],
    // Alabama (Posts 2-3)
    [2, 'CCA-_0038_Layer-16.png'],
    [3, 'CCA-_0038_Layer-16.png'],
    // Alaska (Posts 4-5)
    [4, 'CCA-_0044_Layer-10.png'],
    [5, 'CCA-_0044_Layer-10.png'],
    // Arizona (Posts 6-7)
    [6, 'CCA-_0002_Layer-52.png'],
    [7, 'CCA-_0002_Layer-52.png'],
    // California Roofer GL (Posts 8-9)
    [8, 'CCA-_0007_Layer-47.png'],
    [9, 'CCA-_0053_Layer-1.png'],
    // Certificate of Insurance (Posts 10-11)
    [10, 'CCA-_0027_Layer-27.png'],
    [11, 'CCA-_0039_Layer-15.png'],
    // Commercial Auto (Posts 12-13)
    [12, 'CCA-_0009_Layer-45.png'],
    [13, 'CCA-_0014_Layer-40.png'],
    // Florida (Posts 14-15)
    [14, 'CCA-_0051_Layer-3.png'],
    [15, 'CCA-_0048_Layer-6.png'],
    // Ghost Workers Comp (Posts 16-17)
    [16, 'CCA-_0024_Layer-30.png'],
    [17, 'CCA-_0022_Layer-32.png'],
    // Illinois (Posts 18-19)
    [18, 'CCA-_0037_Layer-17.png'],
    [19, 'CCA-_0037_Layer-17.png'],
    // Kentucky (Posts 20-21)
    [20, 'CCA-_0005_Layer-49.png'],
    [21, 'CCA-_0005_Layer-49.png'],
    // Louisiana (Posts 22-23)
    [22, 'CCA-_0036_Layer-18.png'],
    [23, 'CCA-_0042_Layer-12.png'],
    // Michigan (Posts 24-25)
    [24, 'CCA-_0001_Layer-53.png'],
    [25, 'CCA-_0001_Layer-53.png'],
    // Minnesota (Posts 26-27)
    [26, 'CCA-_0004_Layer-50.png'],
    [27, 'CCA-_0004_Layer-50.png'],
    // Nevada (Posts 28-29)
    [28, 'CCA-_0019_Layer-35.png'],
    [29, 'CCA-_0012_Layer-42.png'],
    // New Jersey (Posts 30-31)
    [30, 'CCA-_0003_Layer-51.png'],
    [31, 'CCA-_0003_Layer-51.png'],
    // New York (Posts 32-33)
    [32, 'CCA-_0047_Layer-7.png'],
    [33, 'CCA-_0046_Layer-8.png'],
    // Pennsylvania (Posts 34-35)
    [34, 'CCA-_0033_Layer-21.png'],
    [35, 'CCA-_0032_Layer-22.png'],
    // Professional Liability (Posts 36-37)
    [36, 'CCA-_0028_Layer-26.png'],
    [37, 'CCA-_0028_Layer-26.png'],
    // Subcontractor (Posts 38-39)
    [38, 'CCA-_0029_Layer-25.png'],
    [39, 'CCA-_0029_Layer-25.png'],
    // Texas (Posts 40-41)
    [40, 'CCA-_0049_Layer-5.png'],
    [41, 'CCA-_0050_Layer-4.png'],
    // Utah (Posts 42-43)
    [42, 'CCA-_0000_Layer-54.png'],
    [43, 'CCA-_0000_Layer-54.png'],
    // Vermont (Posts 44-45)
    [44, 'CCA-_0008_Layer-46.png'],
    [45, 'CCA-_0008_Layer-46.png'],
    // Workers Comp (Posts 46-47)
    [46, 'CCA-_0010_Layer-44.png'],
    [47, 'CCA-_0018_Layer-36.png']
  ];

  console.log(`Updating ${mappings.length} post image mappings...\n`);

  for (const [postIndex, imageFilename] of mappings) {
    try {
      await sql`
        UPDATE posts
        SET image_filename = ${imageFilename}
        WHERE post_index = ${postIndex}
      `;
      console.log(`✓ Post ${postIndex}: ${imageFilename}`);
    } catch (error) {
      console.error(`✗ Post ${postIndex} failed:`, error.message);
    }
  }

  console.log('\n✅ All mappings updated!\n');
  console.log('Verification - First 10 posts:');

  const posts = await sql`
    SELECT post_index, title, image_filename
    FROM posts
    ORDER BY post_index ASC
    LIMIT 10
  `;

  posts.forEach(p => {
    console.log(`${p.post_index}: ${p.title.substring(0, 40)} -> ${p.image_filename}`);
  });
}

fixMappings().catch(console.error);
