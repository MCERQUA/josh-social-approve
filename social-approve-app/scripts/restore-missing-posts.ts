import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

const PLACEHOLDER_IMAGE = 'placeholder-post.png';

interface PostData {
  post_index: number;
  title: string;
  content: string;
  cta: string;
  link: string;
  platform: 'facebook' | 'google_business';
}

// The 4 missing posts (originally IDs 108-111, indexes -49 to -46)
const missingPosts: PostData[] = [
  {
    post_index: -49,
    title: "The Additional Insured Trap",
    content: "Think your additional insured form is correct? 28% of contractors use the wrong CG form number. One client demanded CG 20 37 but the contractor provided CG 20 10. Result: $47,000 out of pocket when a claim hit.",
    cta: "Which additional insured form do you actually need?",
    link: "/blog/coi-mistakes-cost-contractors",
    platform: 'google_business'
  },
  {
    post_index: -48,
    title: "The Waiver of Subrogation Secret",
    content: "Here's something GCs won't tell you: Missing 'waiver of subrogation' language on your certificate exposes YOU to $12,000+ in legal liability. Most contractors don't even know what this means until they're sued.",
    cta: "The certificate language that protects your business",
    link: "/blog/certificate-of-insurance-requirements-for-contractors",
    platform: 'facebook'
  },
  {
    post_index: -47,
    title: "The $8,500 Endorsement Error",
    content: "Single additional insured endorsement error = $8,500+ average cost per incident. That's not including the relationship damage when you delay your client's project by 2 weeks.",
    cta: "How to get your COI right the first time",
    link: "/blog/coi-mistakes-cost-contractors",
    platform: 'google_business'
  },
  {
    post_index: -46,
    title: "The Primary vs Excess Coverage Confusion",
    content: "Your certificate says 'additional insured' but does it say PRIMARY coverage? Most contractors don't know the difference. When it matters, your client's insurance company will bill YOU first.",
    cta: "Why 'additional insured' doesn't mean what you think",
    link: "/blog/certificate-of-insurance-requirements-for-contractors",
    platform: 'facebook'
  }
];

async function restorePosts() {
  console.log('Restoring 4 missing posts...\n');

  for (const post of missingPosts) {
    const fullContent = `${post.content}\n\n${post.cta}\n\nLearn more: https://contractorschoiceagency.com${post.link}`;

    // Insert the post
    const result = await sql`
      INSERT INTO posts (post_index, title, platform, content, image_filename, created_at)
      VALUES (${post.post_index}, ${post.title}, ${post.platform}, ${fullContent}, ${PLACEHOLDER_IMAGE}, NOW())
      RETURNING id
    `;

    const postId = result[0].id;

    // Create pending approval for the post
    await sql`
      INSERT INTO approvals (post_id, status, reviewed_at)
      VALUES (${postId}, 'pending', NOW())
    `;

    console.log(`Restored: "${post.title}" (ID: ${postId}, index: ${post.post_index})`);
  }

  console.log('\nAll 4 missing posts restored with placeholder image!');
}

restorePosts();
