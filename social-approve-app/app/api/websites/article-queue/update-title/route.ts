import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/update-title
 *
 * Updates an article title via VPS API.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, articleId, newTitle } = await request.json();

    if (!domain || !articleId || !newTitle) {
      return NextResponse.json(
        { error: 'domain, articleId, and newTitle are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/update-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, newTitle })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating title:', error);
    return NextResponse.json(
      { error: 'Failed to update title', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
