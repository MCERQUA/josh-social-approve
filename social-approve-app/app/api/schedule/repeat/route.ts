import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// POST - Reset a published post so it can be scheduled again
// This creates a new opportunity to schedule the same content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    // Get the current post status
    const posts = await sql`
      SELECT
        p.*,
        a.scheduled_status,
        a.oneup_post_id,
        b.oneup_category_id as brand_category_id
      FROM posts p
      LEFT JOIN approvals a ON p.id = a.post_id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${post_id}
    `;

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0];

    // Reset the approval record to allow re-scheduling
    // Keep the approvals (text and image) but clear the scheduling
    await sql`
      UPDATE approvals
      SET
        scheduled_status = 'not_scheduled',
        scheduled_for = NULL,
        published_at = NULL,
        oneup_post_id = NULL,
        publish_error = NULL,
        target_platforms = NULL
      WHERE post_id = ${post_id}
    `;

    // Log the repeat action
    await sql`
      INSERT INTO scheduling_history (post_id, action)
      VALUES (${post_id}, 'repeated')
    `;

    return NextResponse.json({
      message: 'Post reset successfully. It will now appear in Ready to Schedule.',
      post_id,
    });
  } catch (error) {
    console.error('Error resetting post:', error);
    return NextResponse.json(
      { error: 'Failed to reset post' },
      { status: 500 }
    );
  }
}
