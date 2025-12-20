import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to directory mapping for websites with non-standard folder names
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA'
};

/**
 * PUT /api/websites/article-queue/update-status
 *
 * Updates an article's status in the topical-map.json
 * This is called by the research workflow when status changes
 *
 * Body: { domain: string, articleId: string, status: 'planned' | 'in_progress' | 'completed' | 'failed' }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, articleId, status } = body;

    if (!domain || !articleId || !status) {
      return NextResponse.json({
        error: 'Missing required parameters',
        required: ['domain', 'articleId', 'status']
      }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['planned', 'in_progress', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Get topical map path
    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const topicalMapPath = path.join(
      WEBSITES_DIR,
      websiteDir,
      'ai/knowledge/04-content-strategy/ready/topical-map.json'
    );

    // Check if topical map exists
    try {
      await fs.access(topicalMapPath);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'No topical map found',
        message: `No topical map found for ${domain}. Cannot update status.`
      }, { status: 404 });
    }

    // Read and parse topical map
    const topicalMapContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(topicalMapContent);

    if (!topicalMap.pillars || !Array.isArray(topicalMap.pillars)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid topical map format',
        message: 'Topical map does not contain pillars array'
      }, { status: 500 });
    }

    // Find and update the article in the nested structure
    let foundArticle: any = null;
    let oldStatus: string = '';

    for (const pillar of topicalMap.pillars) {
      if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
        continue;
      }

      const articleIndex = pillar.supportingArticles.findIndex((article: any) => {
        const fullArticleId = `${pillar.id}-${slugify(article.title || article.id)}`;
        return fullArticleId === articleId || article.id === articleId;
      });

      if (articleIndex !== -1) {
        foundArticle = pillar.supportingArticles[articleIndex];
        oldStatus = foundArticle.status;

        // Update the status
        foundArticle.status = status;

        // Add timestamp fields
        const now = new Date().toISOString();
        if (status === 'in_progress' && !foundArticle.started_at) {
          foundArticle.started_at = now;
        }
        if (status === 'completed' || status === 'failed') {
          foundArticle.completed_at = now;
        }
        foundArticle.updated_at = now;

        break;
      }
    }

    if (!foundArticle) {
      return NextResponse.json({
        success: false,
        error: 'Article not found',
        message: `No article with ID "${articleId}" found in topical map`
      }, { status: 404 });
    }

    // Write back to file
    await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2), 'utf-8');

    console.log(`[QUEUE-STATUS] Updated article "${foundArticle.title}" from "${oldStatus}" to "${status}"`);

    return NextResponse.json({
      success: true,
      message: `Article status updated from "${oldStatus}" to "${status}"`,
      article: foundArticle
    });

  } catch (error: any) {
    console.error('[QUEUE-STATUS] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update article status',
      details: error.message
    }, { status: 500 });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\//g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
