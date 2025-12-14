import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Types for schedule creation
interface CreateScheduleRequest {
  post_id: number;
  brand_id: number;
  first_publish_at: string; // ISO date string
  publish_time: string; // HH:MM format
  repeat_type: 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  repeat_interval?: number;
  repeat_day_of_week?: number[];
  repeat_day_of_month?: number;
  repeat_end_date?: string;
  created_by: string; // 'claude:session' or 'dashboard:user@email'
  notes?: string;
}

// GET - Fetch all schedules for a brand
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get('brand');
    const includeInstances = searchParams.get('instances') === 'true';

    if (!brandSlug) {
      return NextResponse.json({ error: 'brand parameter required' }, { status: 400 });
    }

    // Get brand ID
    const brands = await sql`SELECT id FROM brands WHERE slug = ${brandSlug}`;
    if (brands.length === 0) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    const brandId = brands[0].id;

    // Get schedules with post info
    const schedules = await sql`
      SELECT
        s.*,
        p.title as post_title,
        p.content as post_content,
        p.image_filename as post_image
      FROM post_schedules s
      JOIN posts p ON p.id = s.post_id
      WHERE s.brand_id = ${brandId}
      ORDER BY s.first_publish_at ASC
    `;

    if (includeInstances) {
      // Also fetch instances for each schedule
      const scheduleIds = schedules.map((s: { id: number }) => s.id);

      if (scheduleIds.length > 0) {
        const instances = await sql`
          SELECT * FROM schedule_instances
          WHERE schedule_id = ANY(${scheduleIds})
          ORDER BY scheduled_for ASC
        `;

        // Group instances by schedule_id
        const instanceMap = new Map();
        instances.forEach((i: { schedule_id: number }) => {
          if (!instanceMap.has(i.schedule_id)) {
            instanceMap.set(i.schedule_id, []);
          }
          instanceMap.get(i.schedule_id).push(i);
        });

        // Attach instances to schedules
        const schedulesWithInstances = schedules.map((s: { id: number }) => ({
          ...s,
          instances: instanceMap.get(s.id) || [],
        }));

        return NextResponse.json(schedulesWithInstances);
      }
    }

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// POST - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const body: CreateScheduleRequest = await request.json();

    const {
      post_id,
      brand_id,
      first_publish_at,
      publish_time,
      repeat_type = 'none',
      repeat_interval = 1,
      repeat_day_of_week,
      repeat_day_of_month,
      repeat_end_date,
      created_by,
      notes,
    } = body;

    // Validate required fields
    if (!post_id || !brand_id || !first_publish_at || !publish_time) {
      return NextResponse.json(
        { error: 'post_id, brand_id, first_publish_at, and publish_time are required' },
        { status: 400 }
      );
    }

    // Verify post exists and belongs to brand
    const postCheck = await sql`
      SELECT id, title FROM posts WHERE id = ${post_id} AND brand_id = ${brand_id}
    `;
    if (postCheck.length === 0) {
      return NextResponse.json({ error: 'Post not found or does not belong to this brand' }, { status: 404 });
    }

    // Check if post already has an active schedule
    const existingSchedule = await sql`
      SELECT id FROM post_schedules
      WHERE post_id = ${post_id}
      AND status NOT IN ('completed', 'paused')
    `;
    if (existingSchedule.length > 0) {
      return NextResponse.json(
        { error: 'Post already has an active schedule. Pause or complete it first.' },
        { status: 400 }
      );
    }

    // Create the schedule
    const result = await sql`
      INSERT INTO post_schedules (
        post_id, brand_id, first_publish_at, publish_time,
        repeat_type, repeat_interval, repeat_day_of_week, repeat_day_of_month,
        repeat_end_date, created_by, notes, status
      ) VALUES (
        ${post_id}, ${brand_id}, ${first_publish_at}, ${publish_time},
        ${repeat_type}, ${repeat_interval}, ${repeat_day_of_week || null}, ${repeat_day_of_month || null},
        ${repeat_end_date || null}, ${created_by}, ${notes || null}, 'pending_approval'
      )
      RETURNING *
    `;

    const schedule = result[0];

    // Generate initial instances (6 months ahead)
    const instances = await generateInstances(schedule, 6);

    return NextResponse.json({
      message: 'Schedule created successfully',
      schedule,
      instances,
      instances_count: instances.length,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

// Helper function to generate schedule instances
async function generateInstances(schedule: Record<string, unknown>, monthsAhead: number) {
  const instances: Record<string, unknown>[] = [];
  const startDate = new Date(schedule.first_publish_at as string);
  const endDate = schedule.repeat_end_date
    ? new Date(schedule.repeat_end_date as string)
    : new Date(startDate.getTime() + monthsAhead * 30 * 24 * 60 * 60 * 1000);

  const repeatType = schedule.repeat_type as string;

  if (repeatType === 'none') {
    // One-time post - just create single instance
    const instance = await sql`
      INSERT INTO schedule_instances (
        schedule_id, post_id, brand_id, scheduled_for, status
      ) VALUES (
        ${schedule.id}, ${schedule.post_id}, ${schedule.brand_id}, ${schedule.first_publish_at}, 'pending'
      )
      RETURNING *
    `;
    instances.push(instance[0]);
  } else {
    // Repeating post - generate instances
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Create instance for this date
      const instance = await sql`
        INSERT INTO schedule_instances (
          schedule_id, post_id, brand_id, scheduled_for, status, original_scheduled_for
        ) VALUES (
          ${schedule.id}, ${schedule.post_id}, ${schedule.brand_id},
          ${currentDate.toISOString()}, 'pending', ${currentDate.toISOString()}
        )
        RETURNING *
      `;
      instances.push(instance[0]);

      // Calculate next date based on repeat type
      switch (repeatType) {
        case 'weekly':
          currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'biweekly':
          currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
          break;
        case 'custom':
          const interval = (schedule.repeat_interval as number) || 1;
          currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
          break;
        default:
          // Safety: break out if unknown type
          currentDate = new Date(endDate.getTime() + 1);
      }
    }
  }

  return instances;
}
