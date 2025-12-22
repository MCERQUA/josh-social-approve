import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// VPS API server URL
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * GET /api/brands/:slug/library
 *
 * Proxies to VPS API server which returns content library with metadata.
 * Includes customer notes, SEO filenames, and usage tracking.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Call VPS API server
    const response = await fetch(`${VPS_API_URL}/api/brands/${slug}/library`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`VPS API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching library from VPS:', error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch library',
      files: [],
      stats: {
        total: 0,
        tracked: 0,
        untracked: 0
      }
    });
  }
}
