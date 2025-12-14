import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { scheduleImagePost, isConfigured } from '@/lib/oneup';

// POST - Publish a scheduled post to OneUp
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

    // Check if OneUp is configured
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'OneUp API is not configured' },
        { status: 400 }
      );
    }

    // Get the post details
    const posts = await sql`
      SELECT
        p.*,
        a.scheduled_for,
        a.scheduled_status,
        a.oneup_category_id,
        a.target_platforms
      FROM posts p
      LEFT JOIN approvals a ON p.id = a.post_id
      WHERE p.id = ${post_id}
    `;

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0];

    if (post.scheduled_status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Post is not scheduled' },
        { status: 400 }
      );
    }

    if (!post.oneup_category_id) {
      return NextResponse.json(
        { error: 'No OneUp category configured for this post' },
        { status: 400 }
      );
    }

    // Mark as publishing
    await sql`
      UPDATE approvals
      SET scheduled_status = 'publishing'
      WHERE post_id = ${post_id}
    `;

    try {
      // Build the image URL (assuming images are hosted on the app)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.netlify.app';
      const imageUrl = `${baseUrl}/images/${post.image_filename}`;

      // Get platforms (default to ALL if not specified)
      const platforms = post.target_platforms?.length > 0
        ? post.target_platforms
        : 'ALL';

      // Schedule with OneUp
      const result = await scheduleImagePost({
        categoryId: post.oneup_category_id,
        socialNetworkId: platforms,
        scheduledDateTime: new Date(post.scheduled_for),
        imageUrl,
        content: post.content,
      });

      if (result.error) {
        throw new Error(result.message);
      }

      // Mark as published
      await sql`
        UPDATE approvals
        SET
          scheduled_status = 'published',
          published_at = NOW()
        WHERE post_id = ${post_id}
      `;

      // Log success
      await sql`
        INSERT INTO scheduling_history (post_id, action, oneup_response)
        VALUES (${post_id}, 'published', ${JSON.stringify(result)})
      `;

      return NextResponse.json({
        message: 'Post published to OneUp successfully',
        oneup_response: result,
      });
    } catch (publishError) {
      // Mark as failed
      const errorMessage = publishError instanceof Error ? publishError.message : 'Unknown error';

      await sql`
        UPDATE approvals
        SET
          scheduled_status = 'failed',
          publish_error = ${errorMessage}
        WHERE post_id = ${post_id}
      `;

      // Log failure
      await sql`
        INSERT INTO scheduling_history (post_id, action, error_message)
        VALUES (${post_id}, 'publish_failed', ${errorMessage})
      `;

      return NextResponse.json(
        { error: `Failed to publish: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    );
  }
}
