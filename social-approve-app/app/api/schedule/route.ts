import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - Fetch all scheduled posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const brandSlug = searchParams.get('brand');

    // Get brand ID if brand slug provided
    let brandId: number | null = null;
    if (brandSlug) {
      const brands = await sql`SELECT id FROM brands WHERE slug = ${brandSlug}`;
      if (brands.length > 0) {
        brandId = brands[0].id as number;
      }
    }

    // Get scheduled posts, filtered by brand if specified
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
            AND a.scheduled_status IS NOT NULL
            AND a.scheduled_status != 'not_scheduled'
          ORDER BY a.scheduled_for ASC
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
          WHERE a.scheduled_status IS NOT NULL
            AND a.scheduled_status != 'not_scheduled'
          ORDER BY a.scheduled_for ASC
        `;

    // Filter by status client-side if needed
    let filteredPosts = posts;
    if (statusFilter && statusFilter !== 'all') {
      filteredPosts = posts.filter((row: Record<string, unknown>) => row.scheduled_status === statusFilter);
    }

    // Transform to include nested approval object
    const transformedPosts = filteredPosts.map((row: Record<string, unknown>) => ({
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
        scheduled_status: row.scheduled_status,
        oneup_post_id: row.oneup_post_id,
        oneup_category_id: row.oneup_category_id,
        target_platforms: row.target_platforms || [],
        publish_error: row.publish_error,
        published_at: row.published_at,
      },
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

// POST - Schedule a post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, scheduled_for, category_id, platforms } = body;

    if (!post_id || !scheduled_for) {
      return NextResponse.json(
        { error: 'post_id and scheduled_for are required' },
        { status: 400 }
      );
    }

    // Validate the post exists and is fully approved
    const postCheck = await sql`
      SELECT p.id, a.status, a.image_status
      FROM posts p
      LEFT JOIN approvals a ON p.id = a.post_id
      WHERE p.id = ${post_id}
    `;

    if (postCheck.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const approval = postCheck[0];
    if (approval.status !== 'approved' || approval.image_status !== 'approved') {
      return NextResponse.json(
        { error: 'Post must be fully approved before scheduling' },
        { status: 400 }
      );
    }

    // Get the post title to find paired posts (FB/GBP versions with same content)
    const postInfo = await sql`
      SELECT title, brand_id FROM posts WHERE id = ${post_id}
    `;
    const postTitle = postInfo[0]?.title;
    const brandId = postInfo[0]?.brand_id;

    // Schedule this post AND any paired posts with the same title
    // This ensures both FB and GBP versions are marked as scheduled together
    const result = await sql`
      UPDATE approvals
      SET
        scheduled_for = ${scheduled_for},
        scheduled_status = 'scheduled',
        oneup_category_id = ${category_id || null},
        target_platforms = ${JSON.stringify(platforms || [])},
        ready_to_repost = false
      WHERE post_id IN (
        SELECT id FROM posts
        WHERE title = ${postTitle}
        AND brand_id = ${brandId}
      )
      RETURNING *
    `;

    // Log the scheduling action
    await sql`
      INSERT INTO scheduling_history (post_id, action, scheduled_for, platforms)
      VALUES (${post_id}, 'scheduled', ${scheduled_for}, ${JSON.stringify(platforms || [])})
    `;

    return NextResponse.json({
      message: 'Post scheduled successfully',
      data: result[0],
    });
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

// DELETE - Unschedule a post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    // Check if post is scheduled and get its title for paired posts
    const check = await sql`
      SELECT a.scheduled_status, p.title, p.brand_id
      FROM approvals a
      JOIN posts p ON p.id = a.post_id
      WHERE a.post_id = ${postId}
    `;

    if (check.length === 0 || check[0].scheduled_status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Post is not scheduled' },
        { status: 400 }
      );
    }

    const postTitle = check[0].title;
    const brandId = check[0].brand_id;

    // Unschedule this post AND any paired posts with the same title
    await sql`
      UPDATE approvals
      SET
        scheduled_for = NULL,
        scheduled_status = 'not_scheduled',
        oneup_category_id = NULL,
        target_platforms = '[]'
      WHERE post_id IN (
        SELECT id FROM posts
        WHERE title = ${postTitle}
        AND brand_id = ${brandId}
      )
    `;

    // Log the unscheduling action
    await sql`
      INSERT INTO scheduling_history (post_id, action)
      VALUES (${postId}, 'unscheduled')
    `;

    return NextResponse.json({
      message: 'Post unscheduled successfully',
    });
  } catch (error) {
    console.error('Error unscheduling post:', error);
    return NextResponse.json(
      { error: 'Failed to unschedule post' },
      { status: 500 }
    );
  }
}
