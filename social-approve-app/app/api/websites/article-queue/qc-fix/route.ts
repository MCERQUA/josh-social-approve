import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/websites/article-queue/qc-fix
 *
 * Executes a QC fix for an incomplete article via VPS API
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

    console.log(`[QC-FIX] Triggering fix for ${slug} on ${domain}`);

    const response = await fetch(
      `${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/qc-fix`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`[QC-FIX] Error:`, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log(`[QC-FIX] Success:`, data.message);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error executing QC fix:', error);
    return NextResponse.json(
      { error: 'Failed to execute QC fix', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
