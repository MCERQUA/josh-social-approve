import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - Fetch all schedule instances for calendar view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get('brand');
    const startDate = searchParams.get('start'); // ISO date
    const endDate = searchParams.get('end'); // ISO date

    if (!brandSlug) {
      return NextResponse.json({ error: 'brand parameter required' }, { status: 400 });
    }

    // Get brand ID
    const brands = await sql`SELECT id FROM brands WHERE slug = ${brandSlug}`;
    if (brands.length === 0) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    const brandId = brands[0].id;

    // Default to current month + 6 months if no dates specified
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

    // Get all instances with post and schedule info
    const instances = await sql`
      SELECT
        i.*,
        p.title as post_title,
        p.content as post_content,
        p.image_filename as post_image,
        s.repeat_type,
        s.status as schedule_status,
        s.created_by as schedule_created_by
      FROM schedule_instances i
      JOIN posts p ON p.id = i.post_id
      JOIN post_schedules s ON s.id = i.schedule_id
      WHERE i.brand_id = ${brandId}
        AND i.scheduled_for >= ${start.toISOString()}
        AND i.scheduled_for <= ${end.toISOString()}
      ORDER BY i.scheduled_for ASC
    `;

    // Group by date for calendar view
    const byDate: Record<string, typeof instances> = {};
    instances.forEach((instance: { scheduled_for: string }) => {
      const dateKey = new Date(instance.scheduled_for).toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(instance);
    });

    return NextResponse.json({
      instances,
      byDate,
      total: instances.length,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching schedule instances:', error);
    return NextResponse.json({ error: 'Failed to fetch instances' }, { status: 500 });
  }
}

// PATCH - Update a specific instance (edit date/time, skip, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { instance_id, scheduled_for, status, skip_reason } = body;

    if (!instance_id) {
      return NextResponse.json({ error: 'instance_id required' }, { status: 400 });
    }

    // Build update fields
    const updates: string[] = [];
    const values: unknown[] = [];

    if (scheduled_for) {
      // Mark as modified if date changed
      const current = await sql`
        SELECT scheduled_for, original_scheduled_for FROM schedule_instances WHERE id = ${instance_id}
      `;
      if (current.length > 0) {
        const original = current[0].original_scheduled_for || current[0].scheduled_for;
        await sql`
          UPDATE schedule_instances
          SET scheduled_for = ${scheduled_for},
              original_scheduled_for = ${original},
              is_modified = true,
              updated_at = NOW()
          WHERE id = ${instance_id}
        `;
      }
    }

    if (status) {
      await sql`
        UPDATE schedule_instances
        SET status = ${status},
            skip_reason = ${skip_reason || null},
            updated_at = NOW()
        WHERE id = ${instance_id}
      `;
    }

    // Fetch updated instance
    const updated = await sql`
      SELECT * FROM schedule_instances WHERE id = ${instance_id}
    `;

    return NextResponse.json({
      message: 'Instance updated successfully',
      instance: updated[0],
    });
  } catch (error) {
    console.error('Error updating instance:', error);
    return NextResponse.json({ error: 'Failed to update instance' }, { status: 500 });
  }
}

// DELETE - Delete/skip an instance
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get('id');
    const skipReason = searchParams.get('reason') || 'Manually removed';

    if (!instanceId) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
    }

    // Check if instance is already sent
    const instance = await sql`
      SELECT status FROM schedule_instances WHERE id = ${instanceId}
    `;

    if (instance.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instance[0].status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot delete instance that has already been sent to OneUp' },
        { status: 400 }
      );
    }

    // Mark as skipped instead of hard delete (for audit trail)
    await sql`
      UPDATE schedule_instances
      SET status = 'skipped',
          skip_reason = ${skipReason},
          updated_at = NOW()
      WHERE id = ${instanceId}
    `;

    return NextResponse.json({ message: 'Instance skipped successfully' });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return NextResponse.json({ error: 'Failed to delete instance' }, { status: 500 });
  }
}
