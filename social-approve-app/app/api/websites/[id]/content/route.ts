import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// VPS API for filesystem access (Josh-AI content)
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

// Domain to folder mapping (fallback if not in database)
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA',
  'insulationcontractorsofarizona.com': 'foamologyinsulation-web',
  'foamologyinsulation.com': 'foamologyinsulation-web',
  'humblehelproofing.com': 'humble-help-roofing',
};

// Response types handled by VPS API

/**
 * GET /api/websites/[id]/content
 *
 * Returns both topical map and article queue for a customer's website.
 * Gets website info from database, then calls VPS API for filesystem content.
 *
 * Supports both:
 * - Numeric ID: /api/websites/3/content
 * - Slug (domain_folder): /api/websites/foamologyinsulation-web/content
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

    // Check if id is numeric or a slug
    const isNumeric = /^\d+$/.test(id);

    // Get website and verify ownership
    let websites;
    if (isNumeric) {
      websites = await sql`
        SELECT * FROM websites
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true
      `;
    } else {
      // Look up by domain_folder (slug)
      websites = await sql`
        SELECT * FROM websites
        WHERE domain_folder = ${id} AND tenant_id = ${tenantId} AND is_active = true
      `;
    }

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

    // Call VPS API to get content from Josh-AI filesystem
    const vpsResponse = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(folderName)}`);

    if (!vpsResponse.ok) {
      console.error('VPS API error:', vpsResponse.status, await vpsResponse.text());
      // Return empty content if VPS API fails - don't break the page
      return NextResponse.json({
        website: {
          id: website.id,
          name: website.name,
          url: website.url,
          domain_folder: folderName
        },
        topicalMap: null,
        articleQueue: [],
        stats: {
          total_pillars: 0,
          total_articles: 0,
          planned: 0,
          researching: 0,
          published: 0,
          in_queue: 0
        },
        hasContent: false
      });
    }

    const vpsData = await vpsResponse.json();

    return NextResponse.json({
      website: {
        id: website.id,
        name: website.name,
        url: website.url,
        domain_folder: folderName
      },
      topicalMap: vpsData.topicalMap,
      articleQueue: vpsData.articleQueue || [],
      stats: vpsData.stats || {
        total_pillars: 0,
        total_articles: 0,
        planned: 0,
        researching: 0,
        published: 0,
        in_queue: 0
      },
      hasContent: vpsData.hasContent || false
    });

  } catch (error) {
    console.error('Error fetching website content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions moved to VPS API (jam-social-api)
