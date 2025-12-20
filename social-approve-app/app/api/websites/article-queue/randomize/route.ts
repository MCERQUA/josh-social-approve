import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to directory mapping for websites with non-standard folder names
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA'
};

interface ArticleItem {
  id: string;
  title: string;
  cluster: string;
  keyword: string;
}

/**
 * POST /api/websites/article-queue/randomize
 *
 * Intelligently randomizes the article queue to ensure no two articles with
 * the same topic/cluster or city appear consecutively.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing required field: domain' },
        { status: 400 }
      );
    }

    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const topicalMapPath = path.join(
      WEBSITES_DIR,
      websiteDir,
      'ai/knowledge/04-content-strategy/ready/topical-map.json'
    );

    // Load topical map
    const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(jsonContent);

    if (!topicalMap.pillars || !Array.isArray(topicalMap.pillars)) {
      return NextResponse.json(
        { error: 'Invalid topical map format' },
        { status: 400 }
      );
    }

    // Collect all queueable articles with their metadata
    const allArticles: ArticleItem[] = [];

    for (const pillar of topicalMap.pillars) {
      if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
        continue;
      }

      const queueableArticles = pillar.supportingArticles.filter(
        (a: any) => a.status === 'planned' || a.status === 'researching'
      );

      for (const article of queueableArticles) {
        allArticles.push({
          id: `${pillar.id}-${slugify(article.title || article.id)}`,
          title: article.title || article.id,
          cluster: pillar.title,
          keyword: article.keyword || pillar.primaryKeyword || ''
        });
      }
    }

    if (allArticles.length === 0) {
      return NextResponse.json(
        { error: 'No articles to randomize' },
        { status: 400 }
      );
    }

    // Smart randomization: spread out similar topics and cities
    const randomizedArticles = smartRandomize(allArticles);

    // Update the topical map with new order
    let orderIndex = 0;

    for (const pillar of topicalMap.pillars) {
      if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
        continue;
      }

      for (const article of pillar.supportingArticles) {
        if (article.status === 'planned' || article.status === 'researching') {
          const articleId = `${pillar.id}-${slugify(article.title || article.id)}`;
          const randomizedArticle = randomizedArticles.find(a => a.id === articleId);

          if (randomizedArticle) {
            // Find the new order for this article
            const newOrder = randomizedArticles.indexOf(randomizedArticle) + 1;
            article.queueOrder = newOrder;
            orderIndex++;
          }
        }
      }
    }

    // Write updated topical map back to file
    await fs.writeFile(
      topicalMapPath,
      JSON.stringify(topicalMap, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      totalArticles: randomizedArticles.length,
      message: `Queue randomized successfully with ${randomizedArticles.length} articles`
    });

  } catch (error) {
    console.error('Error randomizing queue:', error);
    return NextResponse.json(
      {
        error: 'Failed to randomize queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Smart randomization algorithm that ensures:
 * - No two articles with the same cluster appear consecutively
 * - No two articles with the same city appear consecutively
 */
function smartRandomize(articles: ArticleItem[]): ArticleItem[] {
  if (articles.length <= 1) return articles;

  // First, shuffle the array randomly
  const shuffled = [...articles].sort(() => Math.random() - 0.5);

  // Group by cluster and city
  const result: ArticleItem[] = [];
  const remaining = [...shuffled];

  // Start with a random article
  const firstIndex = Math.floor(Math.random() * remaining.length);
  result.push(remaining[firstIndex]);
  remaining.splice(firstIndex, 1);

  // Add articles one by one, ensuring diversity
  while (remaining.length > 0) {
    const lastArticle = result[result.length - 1];
    const lastCluster = lastArticle.cluster;
    const lastCity = extractCity(lastArticle.keyword) || extractCity(lastArticle.title);

    // Find the best candidate: different cluster AND different city
    let bestCandidate = -1;
    let secondBestCandidate = -1;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const candidateCluster = candidate.cluster;
      const candidateCity = extractCity(candidate.keyword) || extractCity(candidate.title);

      const differentCluster = candidateCluster !== lastCluster;
      const differentCity = !lastCity || !candidateCity || candidateCity !== lastCity;

      if (differentCluster && differentCity) {
        bestCandidate = i;
        break; // Found ideal candidate
      } else if (differentCluster || differentCity) {
        secondBestCandidate = i; // At least one is different
      }
    }

    // Use best candidate, fall back to second best, or just take next
    const chosenIndex = bestCandidate !== -1
      ? bestCandidate
      : (secondBestCandidate !== -1 ? secondBestCandidate : 0);

    result.push(remaining[chosenIndex]);
    remaining.splice(chosenIndex, 1);
  }

  return result;
}

/**
 * Extract city name from keyword or title
 * Common Arizona cities: Phoenix, Scottsdale, Tempe, Mesa, Chandler, Gilbert, Glendale, Peoria, Tucson
 */
function extractCity(text: string): string | null {
  if (!text) return null;

  const cities = [
    'phoenix', 'scottsdale', 'tempe', 'mesa', 'chandler', 'gilbert',
    'glendale', 'peoria', 'tucson', 'flagstaff', 'yuma', 'prescott',
    'surprise', 'avondale', 'goodyear', 'buckeye', 'casa grande',
    'maricopa', 'oro valley', 'apache junction'
  ];

  const lowerText = text.toLowerCase();

  for (const city of cities) {
    if (lowerText.includes(city)) {
      return city;
    }
  }

  return null;
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
