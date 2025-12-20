import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * GET /api/websites/article-queue/automation?domain=<domain>
 *
 * Gets automation config via VPS API.
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

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/automation`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting automation config:', error);
    return NextResponse.json(
      { error: 'Failed to get automation config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/article-queue/automation
 *
 * Updates automation config via VPS API.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, enabled, schedule, cronExpression } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, schedule, cronExpression })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating automation config:', error);
    return NextResponse.json(
      { error: 'Failed to update automation config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
