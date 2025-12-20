import { NextRequest, NextResponse } from 'next/server';

// VPS API for filesystem access (Josh-AI content)
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

/**
 * GET /api/websites/topical-map?domain=<domain>
 *
 * Loads processed topical map from VPS API.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
    }

    // Call VPS API to get content
    const vpsResponse = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}`);

    if (!vpsResponse.ok) {
      console.error('VPS API error:', vpsResponse.status);
      return NextResponse.json({
        pillars: [],
        message: 'Failed to connect to VPS API'
      });
    }

    const vpsData = await vpsResponse.json();

    if (!vpsData.topicalMap) {
      return NextResponse.json({
        pillars: [],
        message: 'No topical map found for this website.'
      });
    }

    // Return the complete topical map
    return NextResponse.json(vpsData.topicalMap);

  } catch (error) {
    console.error('Error loading topical map:', error);
    return NextResponse.json(
      {
        error: 'Failed to load topical map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
