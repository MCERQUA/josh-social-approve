import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/websites/article-queue/qc?domain=<domain>
 *
 * Scans article research folders via VPS API.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'domain parameter required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/qc`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Disable caching
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in QC scan:', error);
    return NextResponse.json(
      { error: 'Failed to scan articles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/article-queue/qc
 *
 * Trigger QC fix for an article.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, articleSlug, action = 'fix-one' } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'domain required' },
        { status: 400 }
      );
    }

    // For now, just return the QC scan results
    // The actual fixing would be triggered manually or via a separate endpoint
    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/qc`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const scanData = await response.json();

    if (!response.ok) {
      return NextResponse.json(scanData, { status: response.status });
    }

    if (action === 'report-only') {
      return NextResponse.json({
        action: 'report-only',
        ...scanData
      });
    }

    // Find the article to fix
    let targetArticle = null;

    if (articleSlug) {
      targetArticle = scanData.articles?.find((a: { slug: string }) => a.slug === articleSlug);
      if (!targetArticle) {
        return NextResponse.json(
          { error: 'Article not found', slug: articleSlug },
          { status: 404 }
        );
      }
    } else {
      // Auto-select based on priority (easiest to fix first)
      targetArticle = scanData.articles?.find((a: { completionLevel: string }) => a.completionLevel === 'needs-schema')
        || scanData.articles?.find((a: { completionLevel: string }) => a.completionLevel === 'needs-html')
        || scanData.articles?.find((a: { completionLevel: string }) => a.completionLevel === 'needs-draft')
        || scanData.articles?.find((a: { completionLevel: string }) => a.completionLevel === 'needs-research');
    }

    if (!targetArticle) {
      return NextResponse.json({
        success: true,
        message: 'All articles are complete!',
        ...scanData
      });
    }

    return NextResponse.json({
      success: true,
      action: 'fix-one',
      targetArticle,
      scanSummary: {
        totalArticles: scanData.totalArticles,
        complete: scanData.complete,
        incomplete: scanData.totalArticles - scanData.complete
      }
    });
  } catch (error) {
    console.error('Error in QC fix:', error);
    return NextResponse.json(
      { error: 'Failed to process QC request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
