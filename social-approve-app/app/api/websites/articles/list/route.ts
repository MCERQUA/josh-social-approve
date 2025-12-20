import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

const DOMAIN_MAPPING: Record<string, string> = {
  'framing-insurance': 'framing-insurance',
  'spray-foam-insurance': 'spray-foam-insulation-contractors',
  'contractorschoiceagency': 'contractorschoiceagency',
};

/**
 * GET /api/websites/articles/list?domain=<domain>
 *
 * Lists all completed articles from 10-Blog-research directory
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
    }

    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const researchDir = path.join(WEBSITES_DIR, websiteDir, 'ai/knowledge/10-Blog-research');

    // Check if research directory exists
    try {
      await fs.access(researchDir);
    } catch {
      return NextResponse.json({
        domain,
        articles: [],
        total: 0,
        message: 'No articles found yet'
      });
    }

    // Read all directories in 10-Blog-research
    const entries = await fs.readdir(researchDir, { withFileTypes: true });
    const articleDirs = entries.filter(entry => entry.isDirectory() && entry.name !== 'README.md');

    const articles = [];

    for (const dir of articleDirs) {
      const articlePath = path.join(researchDir, dir.name);
      const slug = dir.name;

      // Check for article files
      const hasHtml = await fileExists(path.join(articlePath, 'article-final.html'));
      const hasDraft = await fileExists(path.join(articlePath, 'article-draft.md'));
      const hasSummary = await fileExists(path.join(articlePath, 'research-summary.md'));

      // Read metadata from research-summary.md if it exists
      let title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      let keyword = '';
      let createdDate = '';
      let wordCount = 0;

      if (hasSummary) {
        try {
          const summaryContent = await fs.readFile(path.join(articlePath, 'research-summary.md'), 'utf-8');

          const titleMatch = summaryContent.match(/\*\*Article Title:\*\*\s+(.+)/);
          const keywordMatch = summaryContent.match(/\*\*Target Keyword:\*\*\s+(.+)/);
          const dateMatch = summaryContent.match(/\*\*Created:\*\*\s+(.+)/);

          if (titleMatch) title = titleMatch[1].trim();
          if (keywordMatch) keyword = keywordMatch[1].trim();
          if (dateMatch) createdDate = dateMatch[1].trim();
        } catch (err) {
          // Continue with defaults
        }
      }

      // Get word count from draft if it exists
      if (hasDraft) {
        try {
          const draftContent = await fs.readFile(path.join(articlePath, 'article-draft.md'), 'utf-8');
          wordCount = draftContent.split(/\s+/).length;
        } catch (err) {
          // Continue
        }
      }

      // Get directory stats
      const stats = await fs.stat(articlePath);

      // Count research files
      const researchFiles = await countResearchFiles(articlePath);

      articles.push({
        slug,
        title,
        keyword,
        createdDate: createdDate || stats.ctime.toISOString().split('T')[0],
        wordCount,
        hasHtml,
        hasDraft,
        status: hasHtml ? 'completed' : hasDraft ? 'draft' : 'research',
        researchFileCount: researchFiles,
        lastModified: stats.mtime.toISOString()
      });
    }

    // Sort by most recent first
    articles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({
      domain,
      articles,
      total: articles.length
    });

  } catch (error: any) {
    console.error('Error listing articles:', error);
    return NextResponse.json(
      {
        error: 'Failed to list articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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

async function countResearchFiles(articlePath: string): Promise<number> {
  try {
    const subdirs = [
      'topic-research',
      'keyword-research',
      'authority-link-research',
      'faq-research',
      'internal-link-research'
    ];

    let count = 0;
    for (const subdir of subdirs) {
      const dirPath = path.join(articlePath, subdir);
      try {
        const files = await fs.readdir(dirPath);
        count += files.filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return count;
  } catch {
    return 0;
  }
}
