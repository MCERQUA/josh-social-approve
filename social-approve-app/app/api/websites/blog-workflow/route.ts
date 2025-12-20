import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    // Path to the current research status file
    const websitesDir = join(process.cwd(), '..', '..', '..', 'websites', domain);
    const statusPath = join(websitesDir, 'ai', 'blog-research', 'status', 'current_research.json');
    const queuePath = join(websitesDir, 'ai', 'blog-research', 'queue', 'blog_research_queue.json');

    let currentResearch: {
      title: string;
      slug: string;
      currentPhase: number;
      status: 'idle' | 'running';
      nextUp?: string;
      started?: string;
      estimatedCompletion?: string;
    } = {
      title: 'No active research',
      slug: '',
      currentPhase: 0,
      status: 'idle',
      nextUp: undefined
    };

    try {
      // Try to read current research status
      const statusData = await readFile(statusPath, 'utf-8');
      const status = JSON.parse(statusData);

      if (status.status === 'running') {
        currentResearch = {
          title: status.title || 'Untitled',
          slug: status.slug || '',
          currentPhase: status.current_phase || 0,
          status: 'running',
          started: status.started,
          estimatedCompletion: status.estimated_completion
        };
      }

      // Try to read queue to get "next up"
      try {
        const queueData = await readFile(queuePath, 'utf-8');
        const queue = JSON.parse(queueData);

        if (queue.queue && queue.queue.length > 0) {
          currentResearch.nextUp = queue.queue[0].title;
        }
      } catch (queueError) {
        // Queue file doesn't exist or is empty, ignore
      }
    } catch (statusError) {
      // Status file doesn't exist, return idle state
    }

    return NextResponse.json({
      currentResearch,
      success: true
    });
  } catch (error) {
    console.error('Error fetching blog workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
