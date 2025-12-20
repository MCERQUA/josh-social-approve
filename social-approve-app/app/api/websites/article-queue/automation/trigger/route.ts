import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/automation/trigger
 *
 * Manually triggers article research via VPS API.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/automation/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error triggering automation:', error);
    return NextResponse.json(
      { error: 'Failed to trigger automation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
