import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - Fetch posts ready to be scheduled (fully approved, not yet scheduled)
// Deduped by title - returns only one post per unique title (for OneUp: one post → one category → all platforms)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get('brand');

    // Get brand ID if brand slug provided
    let brandId: number | null = null;
    if (brandSlug) {
      const brands = await sql`SELECT id FROM brands WHERE slug = ${brandSlug}`;
      if (brands.length > 0) {
        brandId = brands[0].id as number;
      }
    }

    // Get ready posts - filter out duplicates (one post → all platforms via OneUp)
    const posts = brandId
      ? await sql`
          SELECT
            p.*,
            a.id as approval_id,
            a.status as approval_status,
            a.rejection_reason,
            a.reviewed_by,
            a.reviewed_at,
            a.image_status,
            a.image_rejection_reason,
            a.image_reviewed_at,
            a.scheduled_for,
            a.scheduled_status,
            a.oneup_post_id,
            a.oneup_category_id,
            a.target_platforms,
            a.publish_error,
            a.published_at
          FROM posts p
          LEFT JOIN approvals a ON p.id = a.post_id
          WHERE p.brand_id = ${brandId}
            AND (p.is_duplicate = false OR p.is_duplicate IS NULL)
            AND a.status = 'approved'
            AND a.image_status = 'approved'
            AND (a.scheduled_status IS NULL OR a.scheduled_status = 'not_scheduled' OR a.ready_to_repost = true)
          ORDER BY p.created_at DESC
        `
      : await sql`
          SELECT
            p.*,
            a.id as approval_id,
            a.status as approval_status,
            a.rejection_reason,
            a.reviewed_by,
            a.reviewed_at,
            a.image_status,
            a.image_rejection_reason,
            a.image_reviewed_at,
            a.scheduled_for,
            a.scheduled_status,
            a.oneup_post_id,
            a.oneup_category_id,
            a.target_platforms,
            a.publish_error,
            a.published_at
          FROM posts p
          LEFT JOIN approvals a ON p.id = a.post_id
          WHERE (p.is_duplicate = false OR p.is_duplicate IS NULL)
            AND a.status = 'approved'
            AND a.image_status = 'approved'
            AND (a.scheduled_status IS NULL OR a.scheduled_status = 'not_scheduled' OR a.ready_to_repost = true)
          ORDER BY p.created_at DESC
        `;

    // Transform to include nested approval object
    const transformedPosts = posts.map((row: Record<string, unknown>) => ({
      id: row.id,
      post_index: row.post_index,
      title: row.title,
      platform: row.platform,
      content: row.content,
      image_filename: row.image_filename,
      created_at: row.created_at,
      approval: {
        id: row.approval_id,
        post_id: row.id,
        status: row.approval_status,
        rejection_reason: row.rejection_reason,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        image_status: row.image_status,
        image_rejection_reason: row.image_rejection_reason,
        image_reviewed_at: row.image_reviewed_at,
        scheduled_for: row.scheduled_for,
        scheduled_status: row.scheduled_status || 'not_scheduled',
        oneup_post_id: row.oneup_post_id,
        oneup_category_id: row.oneup_category_id,
        target_platforms: row.target_platforms || [],
        publish_error: row.publish_error,
        published_at: row.published_at,
      },
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching ready posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ready posts' },
      { status: 500 }
    );
  }
}
