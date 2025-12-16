import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Unified instance type for calendar
interface CalendarInstance {
  id: number;
  schedule_id: number | null;
  post_id: number;
  scheduled_for: string;
  status: 'pending' | 'approved' | 'sending' | 'sent' | 'failed' | 'skipped';
  post_title: string;
  post_content: string;
  post_image: string;
  repeat_type: 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  schedule_status: string;
  is_modified: boolean;
  source: 'schedule' | 'approval'; // Where this instance came from
}

// GET - Fetch all schedule instances for calendar view (unified: both repeat schedules AND one-time posts)
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

    // Get instances from the NEW repeat scheduling system
    const repeatInstances = await sql`
      SELECT
        i.id,
        i.schedule_id,
        i.post_id,
        i.scheduled_for,
        i.status,
        i.is_modified,
        p.title as post_title,
        p.content as post_content,
        p.image_filename as post_image,
        s.repeat_type,
        s.status as schedule_status
      FROM schedule_instances i
      JOIN posts p ON p.id = i.post_id
      JOIN post_schedules s ON s.id = i.schedule_id
      WHERE i.brand_id = ${brandId}
        AND i.scheduled_for >= ${start.toISOString()}
        AND i.scheduled_for <= ${end.toISOString()}
      ORDER BY i.scheduled_for ASC
    `;

    // Get one-time scheduled posts from the OLD approval system
    // Filter out duplicates using is_duplicate column
    const oneTimePosts = await sql`
      SELECT
        a.id,
        NULL as schedule_id,
        p.id as post_id,
        a.scheduled_for,
        CASE
          WHEN a.scheduled_status = 'published' THEN 'sent'
          WHEN a.scheduled_status = 'ready_again' THEN 'sent'
          WHEN a.scheduled_status = 'failed' THEN 'failed'
          WHEN a.scheduled_status = 'publishing' THEN 'sending'
          ELSE 'pending'
        END as status,
        false as is_modified,
        p.title as post_title,
        p.content as post_content,
        p.image_filename as post_image,
        'none' as repeat_type,
        a.scheduled_status as schedule_status
      FROM approvals a
      JOIN posts p ON p.id = a.post_id
      WHERE p.brand_id = ${brandId}
        AND (p.is_duplicate = false OR p.is_duplicate IS NULL)
        AND a.scheduled_for IS NOT NULL
        AND a.scheduled_status != 'not_scheduled'
        AND a.scheduled_for >= ${start.toISOString()}
        AND a.scheduled_for <= ${end.toISOString()}
        AND NOT EXISTS (
          SELECT 1 FROM post_schedules ps
          WHERE ps.post_id = p.id AND ps.status NOT IN ('completed', 'paused')
        )
      ORDER BY a.scheduled_for ASC
    `;

    // Combine and normalize both sources
    const allInstances: CalendarInstance[] = [
      ...repeatInstances.map((i: Record<string, unknown>) => ({
        id: i.id as number,
        schedule_id: i.schedule_id as number | null,
        post_id: i.post_id as number,
        scheduled_for: i.scheduled_for as string,
        status: i.status as CalendarInstance['status'],
        post_title: i.post_title as string,
        post_content: i.post_content as string,
        post_image: i.post_image as string,
        repeat_type: i.repeat_type as CalendarInstance['repeat_type'],
        schedule_status: i.schedule_status as string,
        is_modified: (i.is_modified as boolean) || false,
        source: 'schedule' as const,
      })),
      ...oneTimePosts.map((i: Record<string, unknown>) => ({
        id: i.id as number,
        schedule_id: i.schedule_id as number | null,
        post_id: i.post_id as number,
        scheduled_for: i.scheduled_for as string,
        status: i.status as CalendarInstance['status'],
        post_title: i.post_title as string,
        post_content: i.post_content as string,
        post_image: i.post_image as string,
        repeat_type: i.repeat_type as CalendarInstance['repeat_type'],
        schedule_status: i.schedule_status as string,
        is_modified: (i.is_modified as boolean) || false,
        source: 'approval' as const,
      })),
    ];

    // Sort combined list by scheduled_for
    allInstances.sort(
      (a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
    );

    // Group by date for calendar view
    const byDate: Record<string, CalendarInstance[]> = {};
    allInstances.forEach((instance) => {
      const dateKey = new Date(instance.scheduled_for).toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(instance);
    });

    return NextResponse.json({
      instances: allInstances,
      byDate,
      total: allInstances.length,
      repeatCount: repeatInstances.length,
      oneTimeCount: oneTimePosts.length,
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
