import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// VPS API server URL
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * POST /api/brands/:slug/upload
 *
 * Proxies file upload to VPS API server.
 * Accepts multipart form data and forwards it to the VPS.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get the form data from the request
    const formData = await request.formData();

    // Forward to VPS API server
    const response = await fetch(`${VPS_API_URL}/api/brands/${slug}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `VPS API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading to VPS:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload file',
        success: false
      },
      { status: 500 }
    );
  }
}
