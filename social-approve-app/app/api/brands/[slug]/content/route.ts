import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// VPS API server URL
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * GET /api/brands/:slug/content
 *
 * Proxies to VPS API server which scans the client content folder
 * for images and videos. Works on Netlify (serverless) by using
 * the VPS for filesystem access.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Call VPS API server
    const response = await fetch(`${VPS_API_URL}/api/brands/${slug}/content`, {
      headers: {
        'Accept': 'application/json',
      },
      // Don't cache - always get fresh content
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`VPS API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching content from VPS:', error);

    // Return empty response on error (graceful degradation)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch content',
      files: [],
      stats: {
        total: 0,
        images: 0,
        videos: 0,
        byCategory: {
          'company-images': 0,
          'social-posts': 0,
          'logos': 0,
          'screenshots': 0,
          'other': 0
        }
      }
    });
  }
}
