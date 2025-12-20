import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/start-research
 *
 * Triggers article research via VPS API.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, articleId, title, keyword } = await request.json();

    if (!domain || !articleId || !title) {
      return NextResponse.json(
        { error: 'domain, articleId, and title are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/start-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, articleTitle: title, targetKeyword: keyword })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Add toast message for frontend
    return NextResponse.json({
      ...data,
      showToast: true,
      toastType: 'info',
      toastMessage: `Research started for "${title}" - This will run autonomously for ~30-45 minutes`
    });
  } catch (error) {
    console.error('Error starting research:', error);
    return NextResponse.json(
      { error: 'Failed to start research', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
