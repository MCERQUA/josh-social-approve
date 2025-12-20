import { NextRequest, NextResponse } from 'next/server';

// VPS API for filesystem access (Josh-AI content)
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

interface QueueArticle {
  id: string;
  title: string;
  slug: string;
  target_keyword: string;
  cluster: string;
  cluster_priority: 'high' | 'medium' | 'low';
  source: 'topical_map';
  priority: 'high' | 'medium' | 'low';
  estimated_time_hours: number;
  order: number;
}

/**
 * GET /api/websites/article-queue?domain=<domain>
 *
 * Loads article queue from VPS API via topical-map.json.
 * Filters for articles with status 'planned' or 'researching'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
    }

    // Call VPS API to get content
    const vpsResponse = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}`);

    if (!vpsResponse.ok) {
      console.error('VPS API error:', vpsResponse.status);
      return NextResponse.json({
        articles: [],
        message: 'Failed to connect to VPS API'
      });
    }

    const vpsData = await vpsResponse.json();
    const topicalMap = vpsData.topicalMap;

    if (!topicalMap || !topicalMap.pillars || !Array.isArray(topicalMap.pillars)) {
      return NextResponse.json({
        articles: [],
        message: 'No topical map found or invalid format.'
      });
    }

    // Flatten all articles into a queue
    const articles: QueueArticle[] = [];
    let orderCounter = 1;

    for (const pillar of topicalMap.pillars) {
      if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
        continue;
      }

      // Only include articles with status 'planned' or 'researching'
      const queueableArticles = pillar.supportingArticles.filter(
        (a: any) => a.status === 'planned' || a.status === 'researching'
      );

      for (const article of queueableArticles) {
        const priority = normalizePriority(pillar.priority);

        articles.push({
          id: `${pillar.id}-${article.id}`,
          title: article.title || article.id,
          slug: slugify(article.url || article.title || article.id),
          target_keyword: article.keyword || pillar.primaryKeyword || '',
          cluster: pillar.title,
          cluster_priority: priority,
          source: 'topical_map',
          priority: priority,
          estimated_time_hours: article.estimatedWordCount
            ? Math.ceil(article.estimatedWordCount / 500)
            : estimateTimeHours(article.title || ''),
          order: article.queueOrder || orderCounter++
        });
      }
    }

    // Sort articles by their order
    articles.sort((a, b) => a.order - b.order);

    // Re-assign sequential orders after sorting
    articles.forEach((article, index) => {
      article.order = index + 1;
    });

    return NextResponse.json({ articles });

  } catch (error) {
    console.error('Error reading article queue:', error);
    return NextResponse.json(
      {
        error: 'Failed to read article queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function normalizePriority(priority: string | undefined): 'high' | 'medium' | 'low' {
  if (!priority) return 'medium';

  const p = priority.toLowerCase();
  if (p.includes('critical') || p.includes('highest') || p === 'high') {
    return 'high';
  } else if (p.includes('low')) {
    return 'low';
  }
  return 'medium';
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

function estimateTimeHours(title: string): number {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('guide') || titleLower.includes('complete')) {
    return 4.0;
  } else if (titleLower.includes('introduction') || titleLower.includes('conclusion')) {
    return 2.0;
  } else {
    return 3.5;
  }
}
