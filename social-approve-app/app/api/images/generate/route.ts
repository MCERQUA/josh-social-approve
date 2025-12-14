import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { commitImage, isConfigured as isGitHubConfigured, getImageUrl } from '@/lib/github';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for image generation

interface GenerateImageRequest {
  post_id: number;
  custom_prompt?: string;
}

// Generate a URL-safe filename from title
function generateFilename(title: string, postId: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  const timestamp = Date.now();
  return `${slug}-${postId}-${timestamp}.png`;
}

// Build image generation prompt from post content
function buildImagePrompt(title: string, content: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  return `Create a professional social media image for an insurance company post.

Topic: ${title}

The image should:
- Be clean and professional with a modern business aesthetic
- Use a color scheme of blues, whites, and subtle oranges (contractor/insurance industry colors)
- NOT include any text overlays or words in the image
- Feature relevant imagery: contractors, construction equipment, safety gear, or abstract professional graphics
- Be suitable for Facebook, Instagram, and LinkedIn
- Have a 1:1 square aspect ratio
- Look like a premium stock photo or professional marketing asset

Style: Corporate, trustworthy, modern, clean
Industry: Insurance for contractors (roofing, HVAC, spray foam, electrical, plumbing)

Do NOT include:
- Any text, words, or letters in the image
- Logos or watermarks
- Cluttered or busy backgrounds`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const { post_id, custom_prompt } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Check GitHub is configured
    if (!isGitHubConfigured()) {
      return NextResponse.json(
        { error: 'GitHub integration not configured. Add GITHUB_TOKEN and GITHUB_REPO to environment.' },
        { status: 500 }
      );
    }

    // Check Gemini is configured
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API not configured. Add GEMINI_API_KEY to environment.' },
        { status: 500 }
      );
    }

    // Get the post
    const posts = await sql`
      SELECT id, title, content, image_filename, image_deploy_status
      FROM posts WHERE id = ${post_id}
    `;

    if (posts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // Update status to generating
    await sql`
      UPDATE posts
      SET image_deploy_status = 'generating', updated_at = NOW()
      WHERE id = ${post_id}
    `;

    try {
      // Build the prompt
      const imagePrompt = buildImagePrompt(post.title, post.content, custom_prompt);

      // Call Gemini Imagen API for image generation
      // Using Imagen 3 Fast for quick generation
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ prompt: imagePrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: '1:1',
              safetyFilterLevel: 'block_few',
              personGeneration: 'allow_adult',
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[Imagen] API error:', errorText);
        throw new Error(`Image generation failed: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();

      // Extract base64 image from response
      const imageBase64 = geminiData.predictions?.[0]?.bytesBase64Encoded;
      if (!imageBase64) {
        console.error('[Imagen] No image in response:', JSON.stringify(geminiData));
        throw new Error('No image generated');
      }

      // Generate filename
      const filename = generateFilename(post.title, post_id);

      // Commit to GitHub
      const commitResult = await commitImage(
        imageBase64,
        filename,
        `Add generated image for post: ${post.title}`
      );

      // Update post with new filename and status
      await sql`
        UPDATE posts
        SET
          image_filename = ${filename},
          image_deploy_status = 'pending_deploy',
          image_commit_sha = ${commitResult.commitSha},
          updated_at = NOW()
        WHERE id = ${post_id}
      `;

      const imageUrl = getImageUrl(filename);

      return NextResponse.json({
        success: true,
        message: 'Image generated and committed to GitHub. Netlify will deploy in ~2-5 minutes.',
        post_id,
        filename,
        image_url: imageUrl,
        commit_sha: commitResult.commitSha,
        status: 'pending_deploy',
        estimated_deploy_time: '2-5 minutes',
      });

    } catch (genError) {
      // Update status to failed
      const errorMessage = genError instanceof Error ? genError.message : 'Unknown error';
      await sql`
        UPDATE posts
        SET image_deploy_status = 'failed', image_error = ${errorMessage}, updated_at = NOW()
        WHERE id = ${post_id}
      `;

      console.error('[ImageGen] Failed:', genError);
      return NextResponse.json(
        { error: `Image generation failed: ${errorMessage}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[ImageGen] Request error:', error);
    return NextResponse.json(
      { error: 'Failed to process image generation request' },
      { status: 500 }
    );
  }
}
