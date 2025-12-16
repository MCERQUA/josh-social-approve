import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// POST - Mark a post as ready to repost
// This ONLY sets a flag - does NOT change any calendar/scheduling data
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

    // Just set the flag - nothing else changes
    await sql`
      UPDATE approvals
      SET ready_to_repost = true
      WHERE post_id = ${post_id}
    `;

    return NextResponse.json({
      message: 'Post marked for reposting',
      post_id,
    });
  } catch (error) {
    console.error('Error marking post for repost:', error);
    return NextResponse.json(
      { error: 'Failed to mark post' },
      { status: 500 }
    );
  }
}
