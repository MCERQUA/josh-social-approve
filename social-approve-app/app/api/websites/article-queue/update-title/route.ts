import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to directory mapping for websites with non-standard folder names
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA'
};

/**
 * POST /api/websites/article-queue/update-title
 *
 * Updates an article title in the topical-map.json file.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, articleId, newTitle } = body;

    if (!domain || !articleId || !newTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, articleId, newTitle' },
        { status: 400 }
      );
    }

    // Path to topical map JSON
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
      return NextResponse.json(
        { error: 'Topical map not found for this domain' },
        { status: 404 }
      );
    }

    // Load and parse the topical map JSON
    const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(jsonContent);

    if (!topicalMap.pillars || !Array.isArray(topicalMap.pillars)) {
      return NextResponse.json(
        { error: 'Invalid topical map format' },
        { status: 500 }
      );
    }

    // Find and update the article
    let articleFound = false;

    for (const pillar of topicalMap.pillars) {
      if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
        continue;
      }

      for (const article of pillar.supportingArticles) {
        // Match by stable ID (pillar.id + article.id)
        const generatedId = `${pillar.id}-${article.id}`;

        if (generatedId === articleId) {
          article.title = newTitle;
          articleFound = true;
          break;
        }
      }

      if (articleFound) break;
    }

    if (!articleFound) {
      return NextResponse.json(
        { error: 'Article not found in topical map' },
        { status: 404 }
      );
    }

    // Write updated topical map back to file
    await fs.writeFile(
      topicalMapPath,
      JSON.stringify(topicalMap, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      message: 'Title updated successfully'
    });

  } catch (error) {
    console.error('Error updating article title:', error);
    return NextResponse.json(
      {
        error: 'Failed to update article title',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .replace(/\//g, '-') // Replace slashes with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
