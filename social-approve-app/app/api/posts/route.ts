import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PostWithApproval } from '@/types';

export async function GET() {
  try {
    const result = await sql`
      SELECT
        p.*,
        json_build_object(
          'id', a.id,
          'post_id', a.post_id,
          'status', a.status,
          'rejection_reason', a.rejection_reason,
          'reviewed_by', a.reviewed_by,
          'reviewed_at', a.reviewed_at
        ) as approval
      FROM posts p
      LEFT JOIN approvals a ON p.id = a.post_id
      ORDER BY p.post_index ASC
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
