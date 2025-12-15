import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

// Force dynamic rendering - don't try to execute during build
export const dynamic = 'force-dynamic';

// Text approval (Stage 1)
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

    // Verify post belongs to current tenant
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const postCheck = await sql`
      SELECT p.id FROM posts p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${post_id} AND b.tenant_id = ${tenantId}
    `;
    if (postCheck.length === 0) {
      return NextResponse.json({ error: 'Post not found or access denied' }, { status: 403 });
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a post' },
        { status: 400 }
      );
    }

    // Determine image_status based on text approval
    // If text is approved, image goes to 'pending' for review
    // If text is rejected or pending, image stays 'not_ready'
    const imageStatus = status === 'approved' ? 'pending' : 'not_ready';

    // Update or insert approval
    const result = await sql`
      INSERT INTO approvals (post_id, status, rejection_reason, reviewed_at, image_status)
      VALUES (${post_id}, ${status}, ${rejection_reason || null}, NOW(), ${imageStatus})
      ON CONFLICT (post_id)
      DO UPDATE SET
        status = ${status},
        rejection_reason = ${rejection_reason || null},
        reviewed_at = NOW(),
        image_status = ${imageStatus},
        image_rejection_reason = CASE WHEN ${status} = 'rejected' THEN NULL ELSE approvals.image_rejection_reason END
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
