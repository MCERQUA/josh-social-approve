import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * PUT /api/websites/article-queue/update-status
 *
 * Updates an article's status via VPS API.
 */
export async function PUT(request: NextRequest) {
  try {
    const { domain, articleId, status } = await request.json();

    if (!domain || !articleId || !status) {
      return NextResponse.json(
        { error: 'domain, articleId, and status are required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['planned', 'in_progress', 'researching', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, status })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Failed to update status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
