import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * GET /api/websites/article-queue/sessions?domain=<domain>
 *
 * Lists all research sessions for a domain via VPS API.
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

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/sessions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
