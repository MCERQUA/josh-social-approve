import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

// GET - Fetch brand by slug (only if it belongs to current tenant)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get current tenant
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Only return brand if it belongs to this tenant
    const brands = await sql`
      SELECT
        id,
        slug,
        name,
        short_name,
        oneup_category_id,
        color,
        logo_url,
        website_url
      FROM brands
      WHERE slug = ${slug} AND tenant_id = ${tenantId}
    `;

    if (brands.length === 0) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(brands[0]);
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
      { status: 500 }
    );
  }
}
