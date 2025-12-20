import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ArticleStatus {
  slug: string;
  hasResearch: boolean;
  hasDraft: boolean;
  hasHtml: boolean;
  hasSchema: boolean;
  completionLevel: 'complete' | 'needs-schema' | 'needs-html' | 'needs-draft' | 'needs-research';
  researchFolders: number;
  missingComponents: string[];
}

interface QCScanResult {
  domain: string;
  timestamp: string;
  totalArticles: number;
  complete: number;
  needsSchema: number;
  needsHtml: number;
  needsDraft: number;
  needsResearch: number;
  articles: ArticleStatus[];
  recommendations: string[];
}

/**
 * GET /api/websites/article-queue/qc?domain=framing-insurance
 *
 * Scans article research folders and returns completeness report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({
        error: 'Missing domain parameter'
      }, { status: 400 });
    }

    const researchPath = `/home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research`;

    // Check if research directory exists
    try {
      await fs.access(researchPath);
    } catch {
      return NextResponse.json({
        error: 'Research directory not found',
        path: researchPath
      }, { status: 404 });
    }

    // Get all article directories
    const entries = await fs.readdir(researchPath, { withFileTypes: true });
    const articleDirs = entries.filter(e =>
      e.isDirectory() &&
      !e.name.startsWith('.') &&
      e.name !== 'QC-REPORTS'
    );

    const articles: ArticleStatus[] = [];

    for (const dir of articleDirs) {
      const articlePath = path.join(researchPath, dir.name);

      // Check critical files
      const hasDraft = await fileExists(path.join(articlePath, 'article-draft.md'));
      const hasHtml = await fileExists(path.join(articlePath, 'article-final.html'));
      const hasSchema = await fileExists(path.join(articlePath, 'schema.json'));

      // Check research folders
      const researchFolders = ['topic-research', 'keyword-research', 'authority-link-research', 'faq-research'];
      let researchCount = 0;

      for (const folder of researchFolders) {
        const folderPath = path.join(articlePath, folder);
        if (await directoryHasContent(folderPath)) {
          researchCount++;
        }
      }

      const hasResearch = researchCount >= 3; // At least 3 of 4 research folders

      // Determine completion level and missing components
      const missingComponents: string[] = [];
      let completionLevel: ArticleStatus['completionLevel'];

      if (hasDraft && hasHtml && hasSchema) {
        completionLevel = 'complete';
      } else if (hasDraft && hasHtml && !hasSchema) {
        completionLevel = 'needs-schema';
        missingComponents.push('schema.json');
      } else if (hasDraft && !hasHtml) {
        completionLevel = 'needs-html';
        missingComponents.push('article-final.html');
        if (!hasSchema) missingComponents.push('schema.json');
      } else if (hasResearch && !hasDraft) {
        completionLevel = 'needs-draft';
        missingComponents.push('article-draft.md');
        missingComponents.push('article-final.html');
        missingComponents.push('schema.json');
      } else {
        completionLevel = 'needs-research';
        missingComponents.push('research folders');
        missingComponents.push('article-draft.md');
        missingComponents.push('article-final.html');
        missingComponents.push('schema.json');
      }

      articles.push({
        slug: dir.name,
        hasResearch,
        hasDraft,
        hasHtml,
        hasSchema,
        completionLevel,
        researchFolders: researchCount,
        missingComponents
      });
    }

    // Calculate summary stats
    const complete = articles.filter(a => a.completionLevel === 'complete').length;
    const needsSchema = articles.filter(a => a.completionLevel === 'needs-schema').length;
    const needsHtml = articles.filter(a => a.completionLevel === 'needs-html').length;
    const needsDraft = articles.filter(a => a.completionLevel === 'needs-draft').length;
    const needsResearch = articles.filter(a => a.completionLevel === 'needs-research').length;

    // Generate recommendations
    const recommendations: string[] = [];

    if (needsSchema > 0) {
      recommendations.push(`${needsSchema} article(s) need schema markup (quickest fix - just generate schema.json)`);
    }
    if (needsHtml > 0) {
      recommendations.push(`${needsHtml} article(s) need HTML conversion (convert draft to HTML, then add schema)`);
    }
    if (needsDraft > 0) {
      recommendations.push(`${needsDraft} article(s) have research but need draft writing (medium effort)`);
    }
    if (needsResearch > 0) {
      recommendations.push(`${needsResearch} article(s) need research (highest effort - run full pipeline)`);
    }
    if (complete === articles.length) {
      recommendations.push('All articles are complete! Consider quality review of lower-scored articles.');
    }

    const result: QCScanResult = {
      domain,
      timestamp: new Date().toISOString(),
      totalArticles: articles.length,
      complete,
      needsSchema,
      needsHtml,
      needsDraft,
      needsResearch,
      articles: articles.sort((a, b) => {
        // Sort by completion level (most complete first)
        const order = { 'complete': 0, 'needs-schema': 1, 'needs-html': 2, 'needs-draft': 3, 'needs-research': 4 };
        return order[a.completionLevel] - order[b.completionLevel];
      }),
      recommendations
    };

    console.log(`[QC-SCAN] Domain: ${domain}, Complete: ${complete}/${articles.length}`);

    // Disable caching - always return fresh data
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('[QC-SCAN] Error:', error);
    return NextResponse.json({
      error: 'Failed to scan articles',
      details: error.message
    }, { status: 500 });
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryHasContent(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * POST /api/websites/article-queue/qc
 *
 * Trigger QC process for incomplete articles
 * Body: { domain: string, articleSlug?: string, action: 'fix-one' | 'report-only' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, articleSlug, action = 'fix-one' } = body;

    if (!domain) {
      return NextResponse.json({
        error: 'Missing domain parameter'
      }, { status: 400 });
    }

    // First, get the QC scan results
    const scanUrl = new URL(`http://localhost:6345/api/websites/article-queue/qc?domain=${domain}`);
    const scanResponse = await fetch(scanUrl.toString());
    const scanData = await scanResponse.json();

    if (!scanResponse.ok) {
      return NextResponse.json(scanData, { status: scanResponse.status });
    }

    if (action === 'report-only') {
      // Just return the scan without fixing anything
      return NextResponse.json({
        action: 'report-only',
        ...scanData
      });
    }

    // Find the article to fix
    let targetArticle: ArticleStatus | undefined;

    if (articleSlug) {
      // Specific article requested
      targetArticle = scanData.articles.find((a: ArticleStatus) => a.slug === articleSlug);
      if (!targetArticle) {
        return NextResponse.json({
          error: 'Article not found',
          slug: articleSlug
        }, { status: 404 });
      }
    } else {
      // Auto-select based on priority (easiest to fix first)
      targetArticle = scanData.articles.find((a: ArticleStatus) => a.completionLevel === 'needs-schema')
        || scanData.articles.find((a: ArticleStatus) => a.completionLevel === 'needs-html')
        || scanData.articles.find((a: ArticleStatus) => a.completionLevel === 'needs-draft')
        || scanData.articles.find((a: ArticleStatus) => a.completionLevel === 'needs-research');
    }

    if (!targetArticle) {
      return NextResponse.json({
        success: true,
        message: 'All articles are complete!',
        ...scanData
      });
    }

    // Create QC task prompt based on what's missing
    let qcTask = '';

    if (targetArticle.completionLevel === 'needs-schema') {
      qcTask = `Generate schema.json for article: ${targetArticle.slug}

The article draft and HTML already exist. Your task:
1. Read /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/article-final.html
2. Read /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/article-draft.md
3. Extract FAQ questions from the FAQ section
4. Create comprehensive schema markup (Article, FAQ, BreadcrumbList schemas)
5. Save as /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/schema.json
6. Also save to /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/schema-markup/schema.json

This is a focused task. Complete it fully and report results.`;

    } else if (targetArticle.completionLevel === 'needs-html') {
      qcTask = `Convert article draft to HTML and add schema for: ${targetArticle.slug}

The article draft exists but needs HTML conversion. Your task:
1. Read /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/article-draft.md
2. Create semantic HTML5 version with proper structure
3. Save as /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/article-final.html
4. Then generate schema.json as described above

Complete both HTML conversion and schema generation.`;

    } else if (targetArticle.completionLevel === 'needs-draft') {
      qcTask = `Write article draft based on existing research for: ${targetArticle.slug}

Research exists but no draft. Your task:
1. Read all research files in /home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${targetArticle.slug}/
2. Create comprehensive article plan
3. Write 3500-5000 word article draft
4. Save as article-draft.md
5. Then convert to HTML and add schema

This is a comprehensive task. Follow the research and create quality content.`;

    } else {
      qcTask = `Complete full research and article creation for: ${targetArticle.slug}

This article needs full research. Consider running the /research-article command instead for better results.`;
    }

    // Return the QC task info (don't spawn process yet - user can copy to Claude Code)
    return NextResponse.json({
      success: true,
      action: 'fix-one',
      targetArticle,
      qcTask,
      scanSummary: {
        totalArticles: scanData.totalArticles,
        complete: scanData.complete,
        incomplete: scanData.totalArticles - scanData.complete
      },
      instructions: `To fix this article, run the following in a Claude Code session:\n\n${qcTask}`
    });

  } catch (error: any) {
    console.error('[QC-FIX] Error:', error);
    return NextResponse.json({
      error: 'Failed to process QC request',
      details: error.message
    }, { status: 500 });
  }
}
