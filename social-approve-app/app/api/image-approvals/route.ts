import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Force dynamic rendering - don't try to execute during build
export const dynamic = 'force-dynamic';

// Image approval (Stage 2) - only for posts with approved text
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { post_id, image_status, image_rejection_reason } = body;

    if (!post_id || !image_status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['pending', 'approved', 'rejected'].includes(image_status)) {
      return NextResponse.json(
        { error: 'Invalid image status' },
        { status: 400 }
      );
    }

    if (image_status === 'rejected' && !image_rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an image' },
        { status: 400 }
      );
    }

    // First check if text is approved (prerequisite for image approval)
    const existing = await sql`
      SELECT status FROM approvals WHERE post_id = ${post_id}
    `;

    if (existing.length === 0 || existing[0].status !== 'approved') {
      return NextResponse.json(
        { error: 'Text must be approved before image can be reviewed' },
        { status: 400 }
      );
    }

    // Update image approval status
    const result = await sql`
      UPDATE approvals
      SET
        image_status = ${image_status},
        image_rejection_reason = ${image_rejection_reason || null},
        image_reviewed_at = NOW()
      WHERE post_id = ${post_id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating image approval:', error);
    return NextResponse.json(
      { error: 'Failed to update image approval' },
      { status: 500 }
    );
  }
}
