import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

// Placeholder image - will be replaced with generated images
const PLACEHOLDER_IMAGE = 'placeholder-post.png';

interface PostData {
  title: string;
  content: string;
  cta: string;
  link: string;
}

const posts: PostData[] = [
  // Category 1: COI Mistakes That Cost Big Money (Posts 1-8)
  {
    title: "The 45% Rejection Rate",
    content: "45% of Certificate of Insurance submissions get rejected on first try. That project delay is costing you $3,500 per day while you scramble to fix paperwork. One wrong checkbox = weeks of lost revenue.",
    cta: "Learn the 7 COI mistakes that cost contractors $25,000+ annually",
    link: "/blog/coi-mistakes-cost-contractors"
  },
  {
    title: "The Additional Insured Trap",
    content: "Think your additional insured form is correct? 28% of contractors use the wrong CG form number. One client demanded CG 20 37 but the contractor provided CG 20 10. Result: $47,000 out of pocket when a claim hit.",
    cta: "Which additional insured form do you actually need?",
    link: "/blog/coi-mistakes-cost-contractors"
  },
  {
    title: "The Waiver of Subrogation Secret",
    content: "Here's something GCs won't tell you: Missing 'waiver of subrogation' language on your certificate exposes YOU to $12,000+ in legal liability. Most contractors don't even know what this means until they're sued.",
    cta: "The certificate language that protects your business",
    link: "/blog/certificate-of-insurance-requirements-for-contractors"
  },
  {
    title: "The $8,500 Endorsement Error",
    content: "Single additional insured endorsement error = $8,500+ average cost per incident. That's not including the relationship damage when you delay your client's project by 2 weeks.",
    cta: "How to get your COI right the first time",
    link: "/blog/coi-mistakes-cost-contractors"
  },
  {
    title: "The Primary vs Excess Coverage Confusion",
    content: "Your certificate says 'additional insured' but does it say PRIMARY coverage? Most contractors don't know the difference. When it matters, your client's insurance company will bill YOU first.",
    cta: "Why 'additional insured' doesn't mean what you think",
    link: "/blog/certificate-of-insurance-requirements-for-contractors"
  },
  {
    title: "The Blanket vs Scheduled Mistake",
    content: "Asked for 'blanket' additional insured coverage? Your policy might only have 'scheduled' coverage. One automatically covers new clients. The other requires paperwork for each job. Wrong one = coverage gap.",
    cta: "The blanket coverage question that could save you thousands",
    link: "/blog/certificate-of-insurance-requirements-for-contractors"
  },
  {
    title: "The Operations Completed Gap",
    content: "Your general liability covered the job. But what about 3 years later when that roof leaks? 'Completed operations' coverage is often excluded. Some contractors find out when a lawsuit arrives.",
    cta: "The coverage gap that follows you for years",
    link: "/services/general-liability-insurance"
  },
  {
    title: "The Rush Certificate Premium",
    content: "Need a certificate by tomorrow? That rush fee just cost you 25-40% premium markup. Contractors who plan certificates 2 weeks ahead save thousands annually.",
    cta: "Why last-minute certificates destroy your margins",
    link: "/blog/certificate-of-insurance-requirements-for-contractors"
  },
  // Category 2: Commercial Auto Insurance Traps (Posts 9-16)
  {
    title: "The Personal Auto Myth",
    content: "Using your personal truck for work? One accident and your insurance company has three words: 'Claim denied.' Personal auto policies explicitly exclude commercial use. Every. Single. One.",
    cta: "The $100,000 mistake Florida contractors keep making",
    link: "/blog/florida-personal-vs-commercial-auto"
  },
  {
    title: "The DOT Violation Surprise",
    content: "Texas contractors: That truck carrying equipment over 10,000 lbs? You need DOT authority. Miss this requirement = $15,000 violation. Some contractors find out at a weigh station.",
    cta: "Texas DOT requirements most contractors don't know exist",
    link: "/blog/texas-commercial-auto-dot-violations"
  },
  {
    title: "The Hired Auto Coverage Gap",
    content: "Rented a truck for that big job? Your commercial auto policy might not cover it. 'Hired auto' coverage is a separate endorsement. One contractor learned this after a $67,000 rental truck accident.",
    cta: "The rental vehicle gap in your policy",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Employee Personal Vehicle Risk",
    content: "Your employee uses their personal car for a supply run. They get in an accident. Your business gets sued. Without 'non-owned auto' coverage, you're paying out of pocket. Even for their car.",
    cta: "Why your employee's car is your liability",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Radius Restriction Trap",
    content: "Your commercial auto policy has a 'radius restriction.' That job 150 miles away? Might not be covered. One contractor found out when a claim was denied because the accident was 'outside operating territory.'",
    cta: "The mileage limit hiding in your policy",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Tool Theft Coverage Myth",
    content: "Think your commercial auto covers those $40,000 in tools in your truck? Most don't. Tools and equipment require separate inland marine coverage. Thieves know this. They target trucks at job sites.",
    cta: "Your tools aren't protected (but they should be)",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Trailer Coverage Oversight",
    content: "Your truck is insured. But what about the trailer attached to it? Trailers often need separate coverage. One contractor's $85,000 equipment trailer was stolen. His auto policy covered $0 of it.",
    cta: "The trailer attached to your truck might not be covered",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Symbol Code Secret",
    content: "Your commercial auto policy has 'symbols' that define what's covered. Symbol 1 vs Symbol 7 vs Symbol 8 vs Symbol 9 - each means something different. Wrong symbol = wrong coverage. Most contractors have never checked.",
    cta: "The one-digit code that determines your coverage",
    link: "/blog/commercial-auto-insurance-contractors"
  },
  // Category 3: Workers Comp State-Specific Traps (Posts 17-24)
  {
    title: "The California $50,000 Trap",
    content: "California workers comp violation: MINIMUM $50,000 penalty. Per employee. Per occurrence. One framing contractor with 5 workers faced $250,000 in fines for a paperwork error.",
    cta: "California workers comp rules that bankrupt contractors",
    link: "/blog/california-workers-comp-violations"
  },
  {
    title: "The New York Investigation Trigger",
    content: "NY contractors: One workers comp complaint triggers a state investigation. Average penalty: $25,000+. Plus they'll audit your last 3 years of payroll. Most contractors aren't ready for that audit.",
    cta: "What triggers a NY workers comp investigation",
    link: "/blog/ny-workers-comp-violations"
  },
  {
    title: "The Pennsylvania Fund vs Private Decision",
    content: "Pennsylvania gives you a choice: State fund or private workers comp. Choose wrong and you'll pay 40% more for the same coverage. Some contractors never compare. They just renew.",
    cta: "The PA workers comp choice that could cost you thousands",
    link: "/blog/pennsylvania-workers-comp-fund-vs-private"
  },
  {
    title: "The Subcontractor Exclusion Audit",
    content: "You use subs. They have their own workers comp. But if their coverage lapses during YOUR job, YOUR policy pays the claim. Then your rates spike. This happens to contractors every single month.",
    cta: "Why your sub's workers comp is your problem",
    link: "/blog/subcontractor-insurance-requirements"
  },
  {
    title: "The Classification Code Mistake",
    content: "Workers comp rates vary by 'class code.' Roofers pay $30+ per $100 of payroll. Office workers pay $0.30. Wrong code = wrong rate. Audits catch this. Then you owe thousands in back premiums.",
    cta: "The classification code that determines your workers comp cost",
    link: "/services/workers-compensation-insurance"
  },
  {
    title: "The Executive Exemption Risk",
    content: "Some states let business owners 'exempt' themselves from workers comp. Then you get hurt on a job. Your medical bills are on you. Some contractors learn this from a hospital bed.",
    cta: "Why exempting yourself might be the worst decision",
    link: "/services/workers-compensation-insurance"
  },
  {
    title: "The Experience Mod Mystery",
    content: "Your 'experience modification rate' follows you for years. One bad claim in 2021 is still raising your 2025 premiums. Some contractors pay 40% more than competitors because of claims from years ago.",
    cta: "The number that secretly controls your workers comp cost",
    link: "/blog/impact-of-claims-on-future-premiums"
  },
  {
    title: "The Payroll Estimate Audit Shock",
    content: "You estimated payroll at $200,000. Actual was $350,000. At audit, you owe an extra $15,000 in premium. Due immediately. This surprise bill destroys cash flow for contractors every quarter.",
    cta: "Why your workers comp estimate could cost you",
    link: "/services/workers-compensation-insurance"
  },
  // Category 4: Professional Liability & Coverage Gaps (Posts 25-32)
  {
    title: "The Design-Build Exposure",
    content: "Design-build contractors: Your general liability doesn't cover design errors. A wrong calculation caused $1.2M in structural repairs. The contractor's GL policy said 'professional services excluded.'",
    cta: "The coverage gap design-build contractors don't know they have",
    link: "/blog/professional-liability-insurance-contractors"
  },
  {
    title: "The Consultant Trap",
    content: "You gave advice on a project. That advice was wrong. Someone got hurt. Your GL policy excludes 'professional services.' One contractor paid $340,000 for advice that took 5 minutes to give.",
    cta: "When your advice becomes your biggest liability",
    link: "/blog/professional-liability-insurance-contractors"
  },
  {
    title: "The Specification Error Risk",
    content: "You specified the wrong material. The project failed 2 years later. Your completed operations coverage doesn't cover 'errors in professional judgment.' Who pays? You do.",
    cta: "Why specs mistakes aren't covered by your GL",
    link: "/blog/professional-liability-insurance-contractors"
  },
  {
    title: "The 40% Gap",
    content: "Fewer than 40% of contractors have professional liability insurance. 100% of contractors occasionally give advice. One of these numbers needs to change.",
    cta: "The coverage most contractors skip (until they need it)",
    link: "/blog/professional-liability-insurance-contractors"
  },
  {
    title: "The Pollution Exclusion",
    content: "Standard GL policies exclude pollution. You didn't cause the contamination - you just disturbed it during excavation. Your policy says 'pollution exclusion.' Remediation cost: $180,000.",
    cta: "The excavation risk your insurance doesn't cover",
    link: "/services/general-liability-insurance"
  },
  {
    title: "The Damage to Your Work Exclusion",
    content: "Your work failed. You have to redo it. Your GL policy has a 'damage to your work' exclusion. It covers damage your work causes to OTHER property. Not the cost to fix your own work.",
    cta: "Why your insurance won't pay to fix your mistakes",
    link: "/services/general-liability-insurance"
  },
  {
    title: "The Subcontractor Exception Loophole",
    content: "Your sub did bad work. Now you're responsible. GL policies have a 'subcontractor exception' to the 'your work' exclusion. Some policies have it. Some don't. Have you checked yours?",
    cta: "The policy clause that makes sub errors your problem (or not)",
    link: "/blog/subcontractor-insurance-requirements"
  },
  {
    title: "The Occurrence vs Claims-Made Trap",
    content: "Occurrence policy: Covers claims from work you did in the past. Claims-made: Only covers claims while the policy is active. Cancel a claims-made policy and past work is suddenly uninsured.",
    cta: "Why the type of policy matters more than the price",
    link: "/services/general-liability-insurance"
  },
  // Category 5: Bonding & License Requirements (Posts 33-38)
  {
    title: "The Bid Bond vs Performance Bond Confusion",
    content: "Bid bond: Guarantees you'll sign the contract if you win. Performance bond: Guarantees you'll complete the work. Different bonds. Different times. Submit the wrong one = disqualified bid.",
    cta: "The bond mistake that kills municipal bids",
    link: "/blog/bid-bond-vs-performance-bond"
  },
  {
    title: "The 10% Rule Most Contractors Miss",
    content: "Your bid bond should be 5-10% of project value. Your performance bond should be 100% of contract value. Many contractors don't realize they need BOTH bonds for the same project.",
    cta: "Why one bond isn't enough for government work",
    link: "/blog/bid-bond-vs-performance-bond"
  },
  {
    title: "The Bond Capacity Limit",
    content: "Surety companies limit your total bonding capacity. Take on too many bonded jobs and you can't bid the next one. Some contractors hit their limit and lose contracts they would have won.",
    cta: "The bonding ceiling nobody told you about",
    link: "/services/surety-bonds"
  },
  {
    title: "The Payment Bond Protection",
    content: "Payment bonds protect subcontractors and suppliers. As a sub, you can file a claim against the GC's payment bond if they don't pay you. As a GC, your payment bond exposes you if you're slow paying subs.",
    cta: "The bond that protects subs (and exposes GCs)",
    link: "/services/surety-bonds"
  },
  {
    title: "The License Bond Requirement",
    content: "Many states require license bonds before issuing contractor licenses. No bond = no license = no legal contracting. Bond amounts vary by state and trade. Some contractors skip this step.",
    cta: "The bond that makes your license legal",
    link: "/services/surety-bonds"
  },
  {
    title: "The Maintenance Bond Surprise",
    content: "Job is done. Final payment received. Then the owner demands a maintenance bond. It guarantees your work for 1-2 years after completion. Not in the original contract? You might still owe it.",
    cta: "The post-project bond you didn't expect",
    link: "/services/surety-bonds"
  },
  // Category 6: Subcontractor & Equipment Coverage (Posts 39-44)
  {
    title: "The Subcontractor Certificate Verification Gap",
    content: "You collected COIs from all your subs. But did you verify they're still active? 23% of subcontractor policies lapse mid-project. When your sub's coverage expires during YOUR job, YOUR policy pays their claim.",
    cta: "Why your sub's expired policy becomes your problem",
    link: "/blog/subcontractor-insurance-requirements"
  },
  {
    title: "The Equipment Floater Secret",
    content: "Your $85,000 excavator isn't covered by your GL. It's not covered by your commercial auto. Equipment requires 'inland marine' or 'equipment floater' coverage. Some contractors find this out after a theft.",
    cta: "The separate policy your equipment actually needs",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Borrowed Equipment Risk",
    content: "You borrowed equipment from another contractor. It got damaged on your job site. Your policy might not cover it. Borrowed equipment often needs to be specifically scheduled. Did you tell your agent?",
    cta: "Why borrowed equipment is your liability",
    link: "/services/general-liability-insurance"
  },
  {
    title: "The Leased Equipment Gap",
    content: "Leasing that $200,000 piece of equipment? The leasing company requires you to insure it. Your standard policy might not meet their requirements. One contractor learned this when the lease was called due.",
    cta: "The lease requirement hiding in your contract",
    link: "/services/commercial-auto-insurance"
  },
  {
    title: "The Builder's Risk Misconception",
    content: "The property owner has builder's risk insurance. That covers the building. It doesn't cover YOUR materials stored on site. When $40,000 in materials were stolen, the contractor was on his own.",
    cta: "Why the owner's builder's risk doesn't protect you",
    link: "/services/builders-risk-insurance"
  },
  {
    title: "The Installation Floater Need",
    content: "Materials in transit. Materials at the job site. Materials being installed. Three different exposure points, often three different coverage requirements. Most contractors have gaps in at least one.",
    cta: "The coverage gap between your truck and the finished job",
    link: "/services/builders-risk-insurance"
  },
  // Category 7: Claims, Premiums & Policy Literacy (Posts 45-50)
  {
    title: "The 73% Policy Illiteracy Rate",
    content: "73% of contractors don't fully understand their own insurance policies. They find out what's covered when they file a claim. Sometimes they find out it's not covered.",
    cta: "Do you actually know what your policy covers?",
    link: "/blog/decoding-policy-statements-contractors-guide"
  },
  {
    title: "The Reservation of Rights Letter",
    content: "Your insurance company sent a 'reservation of rights' letter. Most contractors don't know what this means. Translation: 'We might deny this claim.' 50-75% of these letters lead to partial or full denials.",
    cta: "The letter that signals your claim might get denied",
    link: "/blog/reservation-of-rights-letter-contractors"
  },
  {
    title: "The One Claim Premium Spike",
    content: "One workers comp claim increased a contractor's premium by 28% for three years. Not three claims. One claim. Your claims history follows you and compounds. Every claim changes your rates.",
    cta: "How one claim raised rates for 3 years",
    link: "/blog/impact-of-claims-on-future-premiums"
  },
  {
    title: "The Duty to Defend vs Duty to Indemnify",
    content: "Your policy has 'duty to defend' (they'll provide lawyers) and 'duty to indemnify' (they'll pay damages). Some policies only have one or the other. The difference costs thousands.",
    cta: "The legal protection difference most contractors miss",
    link: "/blog/decoding-policy-statements-contractors-guide"
  },
  {
    title: "The Aggregate Limit Trap",
    content: "Your policy shows $1M per occurrence. Great. But the annual aggregate is $2M. After two claims, you're self-insured for the rest of the year. Some contractors find out the hard way.",
    cta: "Why your $1M policy might run out",
    link: "/services/general-liability-insurance"
  },
  {
    title: "The Renewal Audit Surprise",
    content: "Policy renewal looked normal. Then the audit came. Payroll was higher than estimated. Added a truck mid-year. Did a job in a higher-risk category. Audit bill: $14,000. Due in 30 days.",
    cta: "The year-end audit bill that catches contractors off guard",
    link: "/blog/navigating-insurance-renewals-policy-changes"
  }
];

async function seedPosts() {
  console.log('Starting to seed 50 new posts...');

  try {
    // Get current minimum post_index to insert new posts at the top
    const minIndexResult = await sql`SELECT COALESCE(MIN(post_index), 0) as min_index FROM posts`;
    const currentMinIndex = minIndexResult[0]?.min_index || 0;
    console.log(`Current minimum post_index: ${currentMinIndex}`);

    // Start new posts at a lower index so they appear at the top
    let newIndex = currentMinIndex - posts.length;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const postIndex = newIndex + i;

      // Combine hook content with CTA for full post content
      const fullContent = `${post.content}\n\n${post.cta}\n\nLearn more: https://contractorschoiceagency.com${post.link}`;

      // Alternate platforms between facebook and google_business
      const platform = i % 2 === 0 ? 'facebook' : 'google_business';

      // Insert the post
      const result = await sql`
        INSERT INTO posts (post_index, title, platform, content, image_filename, created_at)
        VALUES (${postIndex}, ${post.title}, ${platform}, ${fullContent}, ${PLACEHOLDER_IMAGE}, NOW())
        RETURNING id
      `;

      const postId = result[0].id;

      // Create pending approval for the post
      await sql`
        INSERT INTO approvals (post_id, status, reviewed_at)
        VALUES (${postId}, 'pending', NOW())
      `;

      console.log(`Created post ${i + 1}/50: "${post.title}" (ID: ${postId}, index: ${postIndex})`);
    }

    console.log('\nSuccessfully seeded all 50 posts!');
    console.log('All posts have been added with pending approval status.');
    console.log(`Posts use placeholder image: ${PLACEHOLDER_IMAGE}`);

  } catch (error) {
    console.error('Error seeding posts:', error);
    process.exit(1);
  }
}

seedPosts();
