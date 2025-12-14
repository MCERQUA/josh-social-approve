import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PostWithApproval } from '@/types';

// Force dynamic rendering - don't try to execute during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get('brand');
    const includePosted = searchParams.get('include_posted') === 'true';

    // Get brand ID if provided
    let brandId: number | null = null;
    if (brandSlug) {
      const brands = await sql`SELECT id FROM brands WHERE slug = ${brandSlug}`;
      if (brands.length > 0) {
        brandId = brands[0].id as number;
      }
    }

    // Filter out duplicates and published posts (unless explicitly requested)
    // Order by created_at DESC so newest posts appear first for client review
    const result = brandId
      ? await sql`
          SELECT
            p.*,
            json_build_object(
              'id', a.id,
              'post_id', a.post_id,
              'status', a.status,
              'rejection_reason', a.rejection_reason,
              'reviewed_by', a.reviewed_by,
              'reviewed_at', a.reviewed_at,
              'image_status', COALESCE(a.image_status, 'not_ready'),
              'image_rejection_reason', a.image_rejection_reason,
              'image_reviewed_at', a.image_reviewed_at,
              'scheduled_status', COALESCE(a.scheduled_status, 'not_scheduled'),
              'scheduled_for', a.scheduled_for,
              'published_at', a.published_at
            ) as approval
          FROM posts p
          LEFT JOIN approvals a ON p.id = a.post_id
          WHERE p.brand_id = ${brandId}
            AND (p.is_duplicate = false OR p.is_duplicate IS NULL)
            AND (${includePosted} = true OR COALESCE(a.scheduled_status, 'not_scheduled') != 'published')
          ORDER BY p.created_at DESC
        `
      : await sql`
          SELECT
            p.*,
            json_build_object(
              'id', a.id,
              'post_id', a.post_id,
              'status', a.status,
              'rejection_reason', a.rejection_reason,
              'reviewed_by', a.reviewed_by,
              'reviewed_at', a.reviewed_at,
              'image_status', COALESCE(a.image_status, 'not_ready'),
              'image_rejection_reason', a.image_rejection_reason,
              'image_reviewed_at', a.image_reviewed_at,
              'scheduled_status', COALESCE(a.scheduled_status, 'not_scheduled'),
              'scheduled_for', a.scheduled_for,
              'published_at', a.published_at
            ) as approval
          FROM posts p
          LEFT JOIN approvals a ON p.id = a.post_id
          WHERE (p.is_duplicate = false OR p.is_duplicate IS NULL)
            AND (${includePosted} = true OR COALESCE(a.scheduled_status, 'not_scheduled') != 'published')
          ORDER BY p.created_at DESC
        `;

    return NextResponse.json(result as PostWithApproval[]);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
