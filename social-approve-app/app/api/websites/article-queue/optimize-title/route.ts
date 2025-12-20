import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/optimize-title
 *
 * Optimizes an article title via VPS API (uses Gemini).
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, articleId, currentTitle, targetKeyword } = await request.json();

    if (!domain || !articleId || !currentTitle || !targetKeyword) {
      return NextResponse.json(
        { error: 'domain, articleId, currentTitle, and targetKeyword are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/optimize-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, currentTitle, targetKeyword })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error optimizing title:', error);
    return NextResponse.json(
      { error: 'Failed to optimize title', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
