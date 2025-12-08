import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Website stats - can be updated or connected to a database later
const WEBSITE_STATS = {
  totalLive: 133,
  dotCom: 93,
  netlify: 92,
  wordpress: 41
};

export async function GET() {
  try {
    return NextResponse.json(WEBSITE_STATS);
  } catch (error) {
    console.error('Error fetching website stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website stats' },
      { status: 500 }
    );
  }
}
