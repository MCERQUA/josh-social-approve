import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { scheduleImagePost, isConfigured } from '@/lib/oneup';

// POST - Approve a schedule or instance and send to OneUp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule_id, instance_id, approved_by, category_id } = body;

    // Must have either schedule_id or instance_id
    if (!schedule_id && !instance_id) {
      return NextResponse.json(
        { error: 'Either schedule_id or instance_id is required' },
        { status: 400 }
      );
    }

    if (!approved_by) {
      return NextResponse.json({ error: 'approved_by is required' }, { status: 400 });
    }

    // Check OneUp is configured
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'OneUp API is not configured. Set ONEUP_API_KEY.' },
        { status: 400 }
      );
    }

    if (instance_id) {
      // Approve single instance
      return await approveInstance(instance_id, approved_by, category_id);
    } else {
      // Approve entire schedule (approves all pending instances)
      return await approveSchedule(schedule_id, approved_by, category_id);
    }
  } catch (error) {
    console.error('Error approving schedule:', error);
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
  }
}

async function approveInstance(instanceId: number, approvedBy: string, categoryId?: number) {
  // Get instance with post details
  const instances = await sql`
    SELECT
      i.*,
      p.content as post_content,
      p.image_filename as post_image,
      b.oneup_category_id as brand_category_id
    FROM schedule_instances i
    JOIN posts p ON p.id = i.post_id
    JOIN brands b ON b.id = i.brand_id
    WHERE i.id = ${instanceId}
  `;

  if (instances.length === 0) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
  }

  const instance = instances[0];

  if (instance.status === 'sent') {
    return NextResponse.json({ error: 'Instance already sent' }, { status: 400 });
  }

  if (instance.status === 'skipped') {
    return NextResponse.json({ error: 'Instance was skipped' }, { status: 400 });
  }

  // Use provided category or brand's default
  const oneupCategoryId = categoryId || instance.brand_category_id;

  if (!oneupCategoryId) {
    return NextResponse.json(
      { error: 'No OneUp category configured for this brand' },
      { status: 400 }
    );
  }

  // Mark as sending
  await sql`
    UPDATE schedule_instances
    SET status = 'sending', approved_by = ${approvedBy}, approved_at = NOW()
    WHERE id = ${instanceId}
  `;

  try {
    // Build image URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://josh.jamsocial.app';
    const imageUrl = `${baseUrl}/images/${instance.post_image}`;

    // Send to OneUp
    const result = await scheduleImagePost({
      categoryId: oneupCategoryId,
      socialNetworkId: 'ALL',
      scheduledDateTime: new Date(instance.scheduled_for),
      imageUrl,
      content: instance.post_content,
    });

    if (result.error) {
      throw new Error(result.message);
    }

    // Mark as sent
    await sql`
      UPDATE schedule_instances
      SET status = 'sent',
          oneup_response = ${JSON.stringify(result)},
          sent_at = NOW()
      WHERE id = ${instanceId}
    `;

    return NextResponse.json({
      message: 'Instance approved and sent to OneUp',
      instance_id: instanceId,
      oneup_response: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark as failed
    await sql`
      UPDATE schedule_instances
      SET status = 'failed', error_message = ${errorMessage}
      WHERE id = ${instanceId}
    `;

    return NextResponse.json(
      { error: `Failed to send to OneUp: ${errorMessage}` },
      { status: 500 }
    );
  }
}

async function approveSchedule(scheduleId: number, approvedBy: string, categoryId?: number) {
  // Get schedule
  const schedules = await sql`
    SELECT s.*, b.oneup_category_id as brand_category_id
    FROM post_schedules s
    JOIN brands b ON b.id = s.brand_id
    WHERE s.id = ${scheduleId}
  `;

  if (schedules.length === 0) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  const schedule = schedules[0];
  const oneupCategoryId = categoryId || schedule.brand_category_id;

  if (!oneupCategoryId) {
    return NextResponse.json(
      { error: 'No OneUp category configured for this brand' },
      { status: 400 }
    );
  }

  // Mark schedule as approved
  await sql`
    UPDATE post_schedules
    SET status = 'approved', approved_by = ${approvedBy}, approved_at = NOW()
    WHERE id = ${scheduleId}
  `;

  // Get all pending instances for this schedule
  const pendingInstances = await sql`
    SELECT id FROM schedule_instances
    WHERE schedule_id = ${scheduleId}
    AND status = 'pending'
  `;

  // Approve and send each instance
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const inst of pendingInstances) {
    try {
      const response = await approveInstance(inst.id, approvedBy, oneupCategoryId);
      const data = await response.json();

      if (response.ok) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(data.error || 'Unknown error');
      }
    } catch (error) {
      results.failed++;
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return NextResponse.json({
    message: 'Schedule approved',
    schedule_id: scheduleId,
    results,
  });
}
