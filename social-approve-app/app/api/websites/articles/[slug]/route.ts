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
 * GET /api/websites/articles/[slug]?domain=<domain>
 *
 * Gets full article details including HTML content and all research files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const { slug } = await params;

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
    }

    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const articlePath = path.join(WEBSITES_DIR, websiteDir, 'ai/knowledge/10-Blog-research', slug);

    // Check if article exists
    try {
      await fs.access(articlePath);
    } catch {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Read all available files
    const htmlContent = await readFileOrNull(path.join(articlePath, 'article-final.html'));
    const draftContent = await readFileOrNull(path.join(articlePath, 'article-draft.md'));
    const summaryContent = await readFileOrNull(path.join(articlePath, 'research-summary.md'));

    // Read research files
    const researchFiles: Record<string, any[]> = {};

    const researchCategories = [
      { key: 'topic', dir: 'topic-research', label: 'Topic Research' },
      { key: 'keyword', dir: 'keyword-research', label: 'Keyword Research' },
      { key: 'authority', dir: 'authority-link-research', label: 'Authority Links' },
      { key: 'faq', dir: 'faq-research', label: 'FAQ Research' },
      { key: 'internal', dir: 'internal-link-research', label: 'Internal Links' },
      { key: 'outline', dir: 'article-outline-planner', label: 'Article Outline' },
      { key: 'design', dir: 'article-design', label: 'Design & Images' },
      { key: 'schema', dir: 'schema-markup', label: 'Schema Markup' },
    ];

    for (const category of researchCategories) {
      const categoryPath = path.join(articlePath, category.dir);
      try {
        const files = await fs.readdir(categoryPath);
        const fileContents = [];

        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.json')) {
            const filePath = path.join(categoryPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);

            fileContents.push({
              filename: file,
              content,
              size: stats.size,
              modified: stats.mtime.toISOString()
            });
          }
        }

        researchFiles[category.key] = fileContents;
      } catch {
        researchFiles[category.key] = [];
      }
    }

    // Parse metadata from summary
    let metadata = {
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      keyword: '',
      createdDate: '',
      wordCount: 0,
      targetWordCount: '3500-5000'
    };

    if (summaryContent) {
      const titleMatch = summaryContent.match(/\*\*Article Title:\*\*\s+(.+)/);
      const keywordMatch = summaryContent.match(/\*\*Target Keyword:\*\*\s+(.+)/);
      const dateMatch = summaryContent.match(/\*\*Created:\*\*\s+(.+)/);
      const targetWordCountMatch = summaryContent.match(/\*\*Target Word Count:\*\*\s+(.+)/);

      if (titleMatch) metadata.title = titleMatch[1].trim();
      if (keywordMatch) metadata.keyword = keywordMatch[1].trim();
      if (dateMatch) metadata.createdDate = dateMatch[1].trim();
      if (targetWordCountMatch) metadata.targetWordCount = targetWordCountMatch[1].trim();
    }

    // Calculate word count from draft or HTML
    if (draftContent) {
      metadata.wordCount = draftContent.split(/\s+/).length;
    } else if (htmlContent) {
      // Strip HTML tags for word count
      const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
      metadata.wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    }

    return NextResponse.json({
      slug,
      metadata,
      htmlContent,
      draftContent,
      summaryContent,
      researchFiles,
      hasHtml: !!htmlContent,
      hasDraft: !!draftContent,
      status: htmlContent ? 'completed' : draftContent ? 'draft' : 'research'
    });

  } catch (error: any) {
    console.error('Error getting article:', error);
    return NextResponse.json(
      {
        error: 'Failed to get article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}
