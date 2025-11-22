import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { post_id, status, rejection_reason } = body;

    if (!post_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a post' },
        { status: 400 }
      );
    }

    // Update or insert approval
    const result = await sql`
      INSERT INTO approvals (post_id, status, rejection_reason, reviewed_at)
      VALUES (${post_id}, ${status}, ${rejection_reason || null}, NOW())
      ON CONFLICT (post_id)
      DO UPDATE SET
        status = ${status},
        rejection_reason = ${rejection_reason || null},
        reviewed_at = NOW()
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating approval:', error);
    return NextResponse.json(
      { error: 'Failed to update approval' },
      { status: 500 }
    );
  }
}
