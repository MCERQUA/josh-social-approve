import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTenantId, getTenant } from '@/lib/tenant';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Josh's special stats (his website portfolio)
const JOSH_WEBSITE_STATS = {
  totalLive: 133,
  dotCom: 93,
  netlify: 92,
  wordpress: 41
};

export async function GET() {
  try {
    const tenant = await getTenant();
    const tenantId = tenant?.id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // For Josh, return his special website portfolio stats
    if (tenant?.subdomain === 'josh') {
      return NextResponse.json(JOSH_WEBSITE_STATS);
    }

    // For other tenants, calculate stats from their websites table
    const websites = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN platform = 'netlify' THEN 1 END) as netlify,
        COUNT(CASE WHEN platform = 'wordpress' THEN 1 END) as wordpress,
        COUNT(CASE WHEN url LIKE '%.com' OR url LIKE '%.com/%' THEN 1 END) as dotcom
      FROM websites
      WHERE tenant_id = ${tenantId} AND is_active = true
    `;

    const stats = websites[0] || { total: 0, netlify: 0, wordpress: 0, dotcom: 0 };

    return NextResponse.json({
      totalLive: parseInt(stats.total) || 0,
      dotCom: parseInt(stats.dotcom) || 0,
      netlify: parseInt(stats.netlify) || 0,
      wordpress: parseInt(stats.wordpress) || 0
    });
  } catch (error) {
    console.error('Error fetching website stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website stats' },
      { status: 500 }
    );
  }
}
