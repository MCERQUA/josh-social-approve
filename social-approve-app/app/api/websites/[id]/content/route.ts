import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { promises as fs } from 'fs';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const JOSH_AI_WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to folder mapping (same as Josh-AI system)
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA',
  'insulationcontractorsofarizona.com': 'foamologyinsulation-web',
};

interface TopicalMapPillar {
  id: string;
  title: string;
  pillarPage?: string;
  primaryKeyword?: string;
  priority?: string;
  status?: string;
  supportingArticles?: TopicalMapArticle[];
}

interface TopicalMapArticle {
  id: string;
  title: string;
  keyword?: string;
  status?: string;
  estimatedWordCount?: number;
  url?: string;
  queueOrder?: number;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
}

interface QueueArticle {
  id: string;
  title: string;
  slug: string;
  target_keyword: string;
  cluster: string;
  cluster_priority: 'high' | 'medium' | 'low';
  status: string;
  order: number;
  estimated_hours: number;
}

/**
 * GET /api/websites/[id]/content
 *
 * Returns both topical map and article queue for a customer's website.
 * Reads directly from Josh-AI file system.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId();
    const { id } = await params;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get website and verify ownership
    const websites = await sql`
      SELECT * FROM websites
      WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true
    `;

    if (websites.length === 0) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const website = websites[0];

    // Determine the folder name
    let folderName = website.domain_folder;

    if (!folderName) {
      // Try to extract domain from URL and check mapping
      const urlObj = new URL(website.url);
      const domain = urlObj.hostname.replace('www.', '');
      folderName = DOMAIN_MAPPING[domain] || domain;
    }

    // Path to topical map
    const topicalMapPath = path.join(
      JOSH_AI_WEBSITES_DIR,
      folderName,
      'ai/knowledge/04-content-strategy/ready/topical-map.json'
    );

    // Check if topical map exists
    let topicalMap = null;
    let articleQueue: QueueArticle[] = [];

    try {
      await fs.access(topicalMapPath);
      const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
      topicalMap = JSON.parse(jsonContent);

      // Build article queue from topical map
      if (topicalMap.pillars && Array.isArray(topicalMap.pillars)) {
        let orderCounter = 1;

        for (const pillar of topicalMap.pillars as TopicalMapPillar[]) {
          if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
            continue;
          }

          // Only include articles with status 'planned' or 'researching'
          const queueableArticles = pillar.supportingArticles.filter(
            (a: TopicalMapArticle) => a.status === 'planned' || a.status === 'researching'
          );

          for (const article of queueableArticles) {
            const priority = normalizePriority(pillar.priority);

            articleQueue.push({
              id: `${pillar.id}-${article.id}`,
              title: article.title || article.id,
              slug: slugify(article.url || article.title || article.id),
              target_keyword: article.keyword || pillar.primaryKeyword || '',
              cluster: pillar.title,
              cluster_priority: priority,
              status: article.status || 'planned',
              order: article.queueOrder || orderCounter++,
              estimated_hours: article.estimatedWordCount
                ? Math.ceil(article.estimatedWordCount / 500)
                : 3.5
            });
          }
        }

        // Sort by order
        articleQueue.sort((a, b) => a.order - b.order);
      }
    } catch {
      // No topical map found - that's okay
    }

    // Count articles by status
    const stats = {
      total_pillars: topicalMap?.pillars?.length || 0,
      total_articles: 0,
      planned: 0,
      researching: 0,
      published: 0,
      in_queue: articleQueue.length
    };

    if (topicalMap?.pillars) {
      for (const pillar of topicalMap.pillars as TopicalMapPillar[]) {
        if (pillar.supportingArticles) {
          stats.total_articles += pillar.supportingArticles.length;
          for (const article of pillar.supportingArticles) {
            if (article.status === 'planned') stats.planned++;
            else if (article.status === 'researching') stats.researching++;
            else if (article.status === 'published') stats.published++;
          }
        }
      }
    }

    return NextResponse.json({
      website: {
        id: website.id,
        name: website.name,
        url: website.url,
        domain_folder: folderName
      },
      topicalMap: topicalMap ? {
        metadata: topicalMap._metadata || {},
        pillars: topicalMap.pillars || []
      } : null,
      articleQueue,
      stats,
      hasContent: topicalMap !== null
    });

  } catch (error) {
    console.error('Error fetching website content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function normalizePriority(priority: string | undefined): 'high' | 'medium' | 'low' {
  if (!priority) return 'medium';
  const p = priority.toLowerCase();
  if (p.includes('critical') || p.includes('highest') || p === 'high') return 'high';
  if (p.includes('low')) return 'low';
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
