import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * GET /api/websites/article-queue/sessions/[slug]?domain=<domain>
 *
 * Gets a specific session status via VPS API.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'domain parameter required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/session/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
