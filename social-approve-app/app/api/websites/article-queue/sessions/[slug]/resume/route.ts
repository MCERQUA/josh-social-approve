import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/sessions/[slug]/resume
 *
 * Resumes an interrupted session via VPS API.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/resume-session/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error resuming session:', error);
    return NextResponse.json(
      { error: 'Failed to resume session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
