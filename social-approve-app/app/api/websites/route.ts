import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export interface Website {
  id: number;
  tenant_id: number;
  name: string;
  url: string;
  platform: string;
  description: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET: List all websites for the current tenant
export async function GET() {
  try {
    const tenantId = await getTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const websites = await sql`
      SELECT * FROM websites
      WHERE tenant_id = ${tenantId} AND is_active = true
      ORDER BY is_primary DESC, name ASC
    `;

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch websites' },
      { status: 500 }
    );
  }
}

// POST: Create a new website for the current tenant
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, url, platform = 'custom', description = null, is_primary = false } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // If setting this as primary, unset other primaries first
    if (is_primary) {
      await sql`
        UPDATE websites SET is_primary = false
        WHERE tenant_id = ${tenantId} AND is_primary = true
      `;
    }

    const result = await sql`
      INSERT INTO websites (tenant_id, name, url, platform, description, is_primary)
      VALUES (${tenantId}, ${name}, ${url}, ${platform}, ${description}, ${is_primary})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating website:', error);
    return NextResponse.json(
      { error: 'Failed to create website' },
      { status: 500 }
    );
  }
}

// PUT: Update a website
export async function PUT(request: Request) {
  try {
    const tenantId = await getTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { id, name, url, platform, description, is_primary } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Verify the website belongs to this tenant
    const existing = await sql`
      SELECT * FROM websites WHERE id = ${id} AND tenant_id = ${tenantId}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // If setting this as primary, unset other primaries first
    if (is_primary) {
      await sql`
        UPDATE websites SET is_primary = false
        WHERE tenant_id = ${tenantId} AND is_primary = true AND id != ${id}
      `;
    }

    const result = await sql`
      UPDATE websites SET
        name = COALESCE(${name}, name),
        url = COALESCE(${url}, url),
        platform = COALESCE(${platform}, platform),
        description = COALESCE(${description}, description),
        is_primary = COALESCE(${is_primary}, is_primary),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating website:', error);
    return NextResponse.json(
      { error: 'Failed to update website' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a website
export async function DELETE(request: Request) {
  try {
    const tenantId = await getTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - just mark as inactive
    const result = await sql`
      UPDATE websites SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, website: result[0] });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Failed to delete website' },
      { status: 500 }
    );
  }
}
