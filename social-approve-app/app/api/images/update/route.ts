import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { commitImage, getImageUrl } from '@/lib/github';

export const dynamic = 'force-dynamic';

interface UpdateImageRequest {
  post_id: number;
  image_base64: string; // data:image/jpeg;base64,... format
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateImageRequest = await request.json();
    const { post_id, image_base64 } = body;

    if (!post_id || !image_base64) {
      return NextResponse.json(
        { error: 'Missing post_id or image_base64' },
        { status: 400 }
      );
    }

    // Get post and brand info
    const postResult = await sql`
      SELECT p.id, p.title, p.image_filename, b.slug as brand_slug
      FROM posts p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${post_id}
    `;

    if (postResult.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postResult[0];
    const brandSlug = post.brand_slug as string;

    // Parse the base64 data URL
    const matches = image_base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected data URL.' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const sizeKB = Math.round(imageBuffer.length / 1024);

    console.log(`[ImageUpdate] Updating image for post ${post_id}, size: ${sizeKB}KB`);

    // Use existing filename or generate new one
    let filename = post.image_filename as string;
    if (!filename) {
      const slug = (post.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40);
      filename = `${brandSlug}-${slug}-${post_id}.jpg`;
    }

    // Commit to GitHub
    const imagePath = `public/images/${filename}`;
    const commitMessage = `Update image with logo for post ${post_id}`;

    await commitImage(imagePath, imageBuffer, commitMessage);

    // Get the public URL
    const imageUrl = await getImageUrl(filename);

    // Update post in database
    await sql`
      UPDATE posts
      SET
        image_filename = ${filename},
        image_url = ${imageUrl},
        image_status = 'pending',
        updated_at = NOW()
      WHERE id = ${post_id}
    `;

    console.log(`[ImageUpdate] Successfully updated image for post ${post_id}`);

    return NextResponse.json({
      success: true,
      filename,
      imageUrl,
      sizeKB,
    });

  } catch (error) {
    console.error('[ImageUpdate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update image' },
      { status: 500 }
    );
  }
}
