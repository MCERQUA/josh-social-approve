import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/resume-research
 *
 * Resumes article research via VPS API.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, slug } = await request.json();

    if (!domain || !slug) {
      return NextResponse.json(
        { error: 'domain and slug are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/resume-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
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
      toastMessage: `Research resumed from Phase ${data.resumedFrom} - Will complete autonomously`
    });
  } catch (error) {
    console.error('Error resuming research:', error);
    return NextResponse.json(
      { error: 'Failed to resume research', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
