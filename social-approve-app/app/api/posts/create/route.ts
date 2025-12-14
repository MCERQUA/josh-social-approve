import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CreatePostRequest {
  title: string;
  content: string;
  platform?: string; // 'social' - OneUp posts to all connected platforms
}

export async function POST(request: Request) {
  try {
    const body: CreatePostRequest = await request.json();
    const { title, content } = body;
    // All posts are 'social' - OneUp handles multi-platform posting
    const platform = 'social';

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Get the next post_index
    const maxIndexResult = await sql`
      SELECT COALESCE(MAX(post_index), -1) + 1 as next_index FROM posts
    `;
    const nextIndex = maxIndexResult[0].next_index;

    // Create a placeholder image filename (will be generated later)
    const imageFilename = `CCA-placeholder-${nextIndex}.png`;

    // Insert the new post
    const postResult = await sql`
      INSERT INTO posts (post_index, title, platform, content, image_filename)
      VALUES (${nextIndex}, ${title}, ${platform}, ${content}, ${imageFilename})
      RETURNING *
    `;

    const newPost = postResult[0];

    // Create approval record - text is already approved (user selected it),
    // but image is pending since no image has been generated yet
    const approvalResult = await sql`
      INSERT INTO approvals (post_id, status, reviewed_at, image_status)
      VALUES (${newPost.id}, 'approved', NOW(), 'pending')
      RETURNING *
    `;

    return NextResponse.json({
      post: newPost,
      approval: approvalResult[0],
      message: 'Post created and text approved successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
