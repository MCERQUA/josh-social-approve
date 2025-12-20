import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

const DOMAIN_MAPPING: Record<string, string> = {
  'framing-insurance': 'framing-insurance',
  'spray-foam-insurance': 'spray-foam-insulation-contractors',
  'contractorschoiceagency': 'contractorschoiceagency',
};

/**
 * POST /api/websites/article-queue/resume-research
 *
 * Resumes article research from where it left off by checking existing files
 * and continuing with remaining phases.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, slug } = body;

    if (!domain || !slug) {
      return NextResponse.json({
        error: 'Missing required parameters',
        required: ['domain', 'slug']
      }, { status: 400 });
    }

    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const articlePath = path.join(WEBSITES_DIR, websiteDir, 'ai/knowledge/10-Blog-research', slug);

    // Check if article directory exists
    try {
      await fs.access(articlePath);
    } catch {
      return NextResponse.json({
        error: 'Article not found',
        message: `No article found at ${articlePath}`
      }, { status: 404 });
    }

    // Check what phases are completed
    const phaseStatus = await checkPhaseStatus(articlePath);

    // Build resume prompt based on what's missing
    const resumePrompt = buildResumePrompt(domain, slug, articlePath, phaseStatus);

    console.log(`[ARTICLE-RESUME] Resuming research for: ${slug}`);
    console.log(`[ARTICLE-RESUME] Domain: ${domain}`);
    console.log(`[ARTICLE-RESUME] Completed phases:`, phaseStatus.completed);
    console.log(`[ARTICLE-RESUME] Next phase:`, phaseStatus.nextPhase);

    // Execute Claude Code session with detached mode so it survives app restarts
    const claude = spawn('claude', [
      'code',
      '--dangerously-skip-permissions',
      '--verbose'
    ], {
      cwd: '/home/josh/Josh-AI',
      stdio: ['pipe', 'ignore', 'ignore'],
      detached: true // This keeps it running even if parent dies!
    });

    // Send the resume prompt
    claude.stdin.write(resumePrompt + '\n');
    claude.stdin.end();

    // Unref so the parent can exit without waiting
    claude.unref();

    console.log(`[ARTICLE-RESUME] Claude Code started in detached mode (PID: ${claude.pid})`);

    return NextResponse.json({
      success: true,
      message: `Article research resumed from Phase ${phaseStatus.nextPhase}`,
      domain,
      slug,
      status: 'processing',
      resumedFrom: phaseStatus.nextPhase,
      completedPhases: phaseStatus.completed,
      estimatedTime: '15-30 minutes',
      outputLocation: articlePath,
      showToast: true,
      toastType: 'info',
      toastMessage: `📝 Resuming research from Phase ${phaseStatus.nextPhase} - Will complete autonomously`
    });

  } catch (error: any) {
    console.error('[ARTICLE-RESUME] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to resume article research',
      details: error.message
    }, { status: 500 });
  }
}

async function checkPhaseStatus(articlePath: string) {
  const completed = [];
  let nextPhase = 2;

  // Phase 1: Setup (always completed if directory exists)
  completed.push(1);

  // Phase 2: Research
  const hasKeywordResearch = await fileExists(path.join(articlePath, 'keyword-research/keyword-report.md'));
  const hasAuthorityLinks = await fileExists(path.join(articlePath, 'authority-link-research/authority-sources.md'));
  const hasFaqResearch = await fileExists(path.join(articlePath, 'faq-research/faq-report.md'));
  const hasTopicResearch = await fileExists(path.join(articlePath, 'topic-research/topic-research-report.md'));

  const phase2Complete = hasKeywordResearch && hasAuthorityLinks && hasFaqResearch && hasTopicResearch;
  if (phase2Complete) {
    completed.push(2);
    nextPhase = 3;
  }

  // Phase 3: Quality review (check for completion marker)
  const hasQualityReview = await fileExists(path.join(articlePath, 'research-quality-approved.json'));
  if (hasQualityReview) {
    completed.push(3);
    nextPhase = 4;
  }

  // Phase 4: Article plan
  const hasArticlePlan = await fileExists(path.join(articlePath, 'article-plan.md'));
  if (hasArticlePlan) {
    completed.push(4);
    nextPhase = 5;
  }

  // Phase 5: Draft
  const hasDraft = await fileExists(path.join(articlePath, 'article-draft.md'));
  if (hasDraft) {
    completed.push(5);
    nextPhase = 6;
  }

  // Phase 6: Enhancement (check for internal links)
  const hasInternalLinks = await fileExists(path.join(articlePath, 'internal-links.json'));
  if (hasInternalLinks) {
    completed.push(6);
    nextPhase = 7;
  }

  // Phase 7: HTML
  const hasHtml = await fileExists(path.join(articlePath, 'article-final.html'));
  if (hasHtml) {
    completed.push(7);
    nextPhase = 8;
  }

  // Phase 8: Final review
  const hasFinalReview = await fileExists(path.join(articlePath, 'final-review-approved.json'));
  if (hasFinalReview) {
    completed.push(8);
    nextPhase = 9;
  }

  // Phase 9: Schema
  const hasSchema = await fileExists(path.join(articlePath, 'schema.json'));
  if (hasSchema) {
    completed.push(9);
    nextPhase = 10; // All done!
  }

  return {
    completed,
    nextPhase,
    phase2: {
      hasKeywordResearch,
      hasAuthorityLinks,
      hasFaqResearch,
      hasTopicResearch
    }
  };
}

function buildResumePrompt(domain: string, slug: string, articlePath: string, phaseStatus: any) {
  const metadata = extractMetadataFromPath(articlePath, slug);

  let prompt = `# Resume Article Research - ${metadata.title}

**Article Directory:** ${articlePath}
**Website:** ${domain}
**Slug:** ${slug}
**Current Status:** Partially completed - resuming from Phase ${phaseStatus.nextPhase}

## Completed Phases
${phaseStatus.completed.map((p: number) => `✅ Phase ${p}`).join('\n')}

## Your Mission
Complete the remaining phases of the article research workflow. DO NOT redo completed phases.

`;

  // Phase 2: Complete missing research
  if (phaseStatus.nextPhase === 2) {
    prompt += `
## Phase 2: Complete Missing Research

Already completed:
${phaseStatus.phase2.hasKeywordResearch ? '✅ Keyword research' : ''}
${phaseStatus.phase2.hasAuthorityLinks ? '✅ Authority links' : ''}
${phaseStatus.phase2.hasFaqResearch ? '✅ FAQ research' : ''}
${phaseStatus.phase2.hasTopicResearch ? '✅ Topic research' : ''}

Missing research to complete:
${!phaseStatus.phase2.hasTopicResearch ? '❌ Topic research - Use topic-research-agent to create comprehensive topic research' : ''}

After completing missing research, proceed to Phase 3.
`;
  }

  // Phase 3: Quality Review
  if (phaseStatus.nextPhase === 3) {
    prompt += `
## Phase 3: Quality Review

Use an agent to review all research files and approve quality. Create a file \`research-quality-approved.json\` when approved.

Then proceed to Phase 4.
`;
  }

  // Phase 4: Article Planning
  if (phaseStatus.nextPhase === 4) {
    prompt += `
## Phase 4: Create Article Outline

Create a comprehensive article outline in \`article-plan.md\` based on all research. Include:
- Introduction hook
- H2 and H3 sections
- Word count targets per section
- Key points to cover
- FAQ section placement

Then proceed to Phase 5.
`;
  }

  // Phase 5: Draft Writing
  if (phaseStatus.nextPhase === 5) {
    prompt += `
## Phase 5: Write Article Draft

Write a 3500-5000 word article in \`article-draft.md\` following the outline. Include:
- Engaging introduction
- Comprehensive coverage of the topic
- Natural keyword integration
- FAQ section
- Strong conclusion

Then proceed to Phase 6.
`;
  }

  // Phase 6: Enhancement
  if (phaseStatus.nextPhase === 6) {
    prompt += `
## Phase 6: Enhance Article

- Add internal links (save to \`internal-links.json\`)
- Create image prompts in \`article-design/\`
- Validate all authority links

Then proceed to Phase 7.
`;
  }

  // Phase 7: HTML Creation
  if (phaseStatus.nextPhase === 7) {
    prompt += `
## Phase 7: Create HTML Version

Convert the markdown draft to a fully-styled HTML article in \`article-final.html\`. Include:
- Proper semantic HTML
- All styling inline or in <style> tag
- Responsive design
- Image placeholders
- Internal and external links

Then proceed to Phase 8.
`;
  }

  // Phase 8: Final Review
  if (phaseStatus.nextPhase === 8) {
    prompt += `
## Phase 8: Final Agent Review

Use an agent to review both markdown and HTML versions. Create \`final-review-approved.json\` when approved.

Then proceed to Phase 9.
`;
  }

  // Phase 9: Schema Markup
  if (phaseStatus.nextPhase === 9) {
    prompt += `
## Phase 9: Generate Schema Markup

Create comprehensive schema markup in \`schema.json\` targeting featured snippets. Include:
- Article schema
- FAQ schema
- HowTo schema (if applicable)

## Completion

Once Phase 9 is complete, the article is ready for publication!
`;
  }

  prompt += `

## Critical Rules
- **DO NOT redo completed phases** - only work on what's missing
- **Work autonomously** - don't stop for approval between phases
- **Use agents** for quality reviews (Phases 3 and 8)
- **Continue until 100% complete** - all 9 phases finished

Start now with Phase ${phaseStatus.nextPhase}.`;

  return prompt;
}

function extractMetadataFromPath(articlePath: string, slug: string): any {
  return {
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
