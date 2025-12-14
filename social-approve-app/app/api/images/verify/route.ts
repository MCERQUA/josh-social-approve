import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getImageUrl } from '@/lib/github';

export const dynamic = 'force-dynamic';

interface VerifyRequest {
  post_id: number;
}

// Check if an image URL is accessible
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// POST - Verify a single post's image deployment
export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Get the post
    const posts = await sql`
      SELECT id, title, image_filename, image_deploy_status, image_commit_sha
      FROM posts WHERE id = ${post_id}
    `;

    if (posts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // If no image filename, nothing to verify
    if (!post.image_filename) {
      return NextResponse.json({
        verified: false,
        status: 'no_image',
        message: 'Post has no image assigned',
      });
    }

    // Check if image is accessible
    const imageUrl = getImageUrl(post.image_filename);
    const isAccessible = await isImageAccessible(imageUrl);

    if (isAccessible) {
      // Update status to deployed
      await sql`
        UPDATE posts
        SET image_deploy_status = 'deployed', updated_at = NOW()
        WHERE id = ${post_id}
      `;

      return NextResponse.json({
        verified: true,
        status: 'deployed',
        image_url: imageUrl,
        message: 'Image is deployed and accessible',
      });
    } else {
      // Still pending deployment
      return NextResponse.json({
        verified: false,
        status: post.image_deploy_status || 'pending_deploy',
        image_url: imageUrl,
        message: 'Image not yet accessible. Netlify may still be deploying.',
        suggestion: 'Wait 2-5 minutes and try again.',
      });
    }

  } catch (error) {
    console.error('[ImageVerify] Error:', error);
    return NextResponse.json({ error: 'Failed to verify image' }, { status: 500 });
  }
}

// GET - Verify all pending images (batch check)
export async function GET() {
  try {
    // Get all posts with pending_deploy status
    const pendingPosts = await sql`
      SELECT id, title, image_filename, image_deploy_status, image_commit_sha
      FROM posts
      WHERE image_deploy_status = 'pending_deploy'
      ORDER BY updated_at ASC
    `;

    const results = {
      checked: 0,
      deployed: 0,
      still_pending: 0,
      details: [] as Array<{
        post_id: number;
        title: string;
        status: string;
        image_url: string;
      }>,
    };

    for (const post of pendingPosts) {
      results.checked++;

      const imageUrl = getImageUrl(post.image_filename);
      const isAccessible = await isImageAccessible(imageUrl);

      if (isAccessible) {
        // Update status to deployed
        await sql`
          UPDATE posts
          SET image_deploy_status = 'deployed', updated_at = NOW()
          WHERE id = ${post.id}
        `;
        results.deployed++;
        results.details.push({
          post_id: post.id,
          title: post.title,
          status: 'deployed',
          image_url: imageUrl,
        });
      } else {
        results.still_pending++;
        results.details.push({
          post_id: post.id,
          title: post.title,
          status: 'pending_deploy',
          image_url: imageUrl,
        });
      }
    }

    return NextResponse.json({
      message: `Checked ${results.checked} images: ${results.deployed} deployed, ${results.still_pending} still pending`,
      ...results,
    });

  } catch (error) {
    console.error('[ImageVerify] Batch error:', error);
    return NextResponse.json({ error: 'Failed to verify images' }, { status: 500 });
  }
}
