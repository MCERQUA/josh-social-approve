import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { commitImage, isConfigured as isGitHubConfigured, getImageUrl } from '@/lib/github';
import { getBrandImageConfig, buildPostImagePrompt, BrandImageConfig } from '@/lib/brand-image-config';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for image generation

// Target: 1024x1024, JPEG at 85% quality = ~200-400KB
const IMAGE_MAX_SIZE = 1024;
const JPEG_QUALITY = 85;
const MAX_FILE_SIZE_KB = 500;
const LOGO_SIZE = 180; // Logo size in pixels
const LOGO_PADDING = 30; // Padding from edge

interface GenerateImageRequest {
  post_id: number;
  custom_prompt?: string;
}

// Generate a URL-safe filename from title (now .jpg for compressed output)
function generateFilename(title: string, postId: number, brandSlug: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);

  const timestamp = Date.now();
  return `${brandSlug.toLowerCase()}-${slug}-${postId}-${timestamp}.jpg`;
}

// Composite logo onto image using Sharp
async function compositeLogoOnImage(
  imageBuffer: Buffer,
  config: BrandImageConfig
): Promise<Buffer> {
  if (!config.logoPath) {
    console.log('[ImageGen] No logo configured for brand, skipping composite');
    return imageBuffer;
  }

  try {
    // Read the logo file
    const logoFullPath = path.join(process.cwd(), 'public', config.logoPath);
    const logoBuffer = await readFile(logoFullPath);

    // Get image metadata
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width || IMAGE_MAX_SIZE;
    const imageHeight = imageMetadata.height || IMAGE_MAX_SIZE;

    // Resize logo to appropriate size
    const resizedLogo = await sharp(logoBuffer)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png() // Keep logo as PNG for transparency
      .toBuffer();

    // Calculate position based on config
    let left: number;
    let top: number;

    switch (config.logoPosition) {
      case 'top-right':
        left = imageWidth - LOGO_SIZE - LOGO_PADDING;
        top = LOGO_PADDING;
        break;
      case 'bottom-left':
        left = LOGO_PADDING;
        top = imageHeight - LOGO_SIZE - LOGO_PADDING;
        break;
      case 'bottom-right':
        left = imageWidth - LOGO_SIZE - LOGO_PADDING;
        top = imageHeight - LOGO_SIZE - LOGO_PADDING;
        break;
      case 'top-left':
      default:
        left = LOGO_PADDING;
        top = LOGO_PADDING;
        break;
    }

    // Composite the logo onto the image
    const composited = await sharp(imageBuffer)
      .composite([
        {
          input: resizedLogo,
          left: Math.round(left),
          top: Math.round(top),
        },
      ])
      .toBuffer();

    console.log(`[ImageGen] Logo composited at ${config.logoPosition} position`);
    return composited;

  } catch (err) {
    console.error('[ImageGen] Logo composite failed:', err);
    // Return original image if composite fails
    return imageBuffer;
  }
}

// Compress and optimize image for social media
async function compressImage(base64Input: string): Promise<{ buffer: Buffer; sizeKB: number }> {
  // Decode base64 to buffer
  const inputBuffer = Buffer.from(base64Input, 'base64');

  // Process with sharp: resize and convert to JPEG
  let quality = JPEG_QUALITY;
  let outputBuffer: Buffer;

  // Start with target quality
  outputBuffer = await sharp(inputBuffer)
    .resize(IMAGE_MAX_SIZE, IMAGE_MAX_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // If still too large, reduce quality
  while (outputBuffer.length > MAX_FILE_SIZE_KB * 1024 && quality > 60) {
    quality -= 5;
    outputBuffer = await sharp(inputBuffer)
      .resize(IMAGE_MAX_SIZE, IMAGE_MAX_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  const sizeKB = Math.round(outputBuffer.length / 1024);
  console.log(`[ImageGen] Compressed to ${sizeKB}KB at quality ${quality}`);

  return {
    buffer: outputBuffer,
    sizeKB,
  };
}

// Final compression after logo composite
async function finalCompress(buffer: Buffer): Promise<{ base64: string; sizeKB: number }> {
  let quality = JPEG_QUALITY;
  let outputBuffer = await sharp(buffer)
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // If still too large, reduce quality
  while (outputBuffer.length > MAX_FILE_SIZE_KB * 1024 && quality > 60) {
    quality -= 5;
    outputBuffer = await sharp(buffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  const sizeKB = Math.round(outputBuffer.length / 1024);
  console.log(`[ImageGen] Final compression: ${sizeKB}KB at quality ${quality}`);

  return {
    base64: outputBuffer.toString('base64'),
    sizeKB,
  };
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

    // Get the post with brand info
    const posts = await sql`
      SELECT p.id, p.title, p.content, p.brand_id, p.image_filename, p.image_deploy_status,
             b.slug as brand_slug, b.name as brand_name
      FROM posts p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${post_id}
    `;

    if (posts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];
    const brandId = post.brand_id as number;
    const brandSlug = (post.brand_slug as string) || 'default';

    // Load brand image configuration
    let brandConfig: BrandImageConfig | null = null;
    if (brandId) {
      brandConfig = await getBrandImageConfig(brandId);
    }

    // Update status to generating
    await sql`
      UPDATE posts
      SET image_deploy_status = 'generating', updated_at = NOW()
      WHERE id = ${post_id}
    `;

    try {
      // Build the image prompt
      let imagePrompt: string;

      if (brandConfig) {
        // Use brand-specific prompt
        imagePrompt = buildPostImagePrompt(
          brandConfig,
          post.title as string,
          post.content as string,
          custom_prompt
        );
        console.log(`[ImageGen] Using brand config for ${brandConfig.brandName}`);
        console.log(`[ImageGen] Colors: ${brandConfig.primaryColor}, ${brandConfig.secondaryColor}`);
        console.log(`[ImageGen] Logo: ${brandConfig.logoPath || 'none'}`);
      } else {
        // Fallback to generic prompt
        imagePrompt = custom_prompt || buildGenericPrompt(post.title as string, post.content as string);
        console.log('[ImageGen] Using generic prompt (no brand config)');
      }

      console.log(`[ImageGen] Generating image for post ${post_id}: "${post.title}"`);

      // Call Gemini Imagen API for image generation
      // Using Imagen 3 Pro at 1024x1024 (1K) resolution
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiApiKey}`,
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
              outputOptions: {
                mimeType: 'image/jpeg',
              },
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
      const rawImageBase64 = geminiData.predictions?.[0]?.bytesBase64Encoded;
      if (!rawImageBase64) {
        console.error('[Imagen] No image in response:', JSON.stringify(geminiData));
        throw new Error('No image generated');
      }

      // Compress image
      console.log(`[ImageGen] Raw image size: ${Math.round(rawImageBase64.length * 0.75 / 1024)}KB`);
      const { buffer: compressedBuffer } = await compressImage(rawImageBase64);

      // Composite logo if brand config has one
      let finalBuffer: Buffer = compressedBuffer;
      if (brandConfig && brandConfig.logoPath) {
        finalBuffer = await compositeLogoOnImage(compressedBuffer, brandConfig);
      }

      // Final compression
      const { base64: finalBase64, sizeKB } = await finalCompress(finalBuffer);

      // Generate filename with brand prefix
      const filename = generateFilename(post.title as string, post_id, brandSlug);

      // Commit compressed image to GitHub
      const commitResult = await commitImage(
        finalBase64,
        filename,
        `Add branded image for ${brandSlug}: ${post.title} (${sizeKB}KB)`
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
        message: `Branded image generated (${sizeKB}KB) and committed to GitHub. Netlify will deploy in ~2-5 minutes.`,
        post_id,
        brand: brandSlug,
        filename,
        file_size_kb: sizeKB,
        image_url: imageUrl,
        commit_sha: commitResult.commitSha,
        status: 'pending_deploy',
        has_logo: !!(brandConfig?.logoPath),
        brand_colors: brandConfig ? {
          primary: brandConfig.primaryColor,
          secondary: brandConfig.secondaryColor,
        } : null,
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

// Fallback generic prompt when no brand config
function buildGenericPrompt(title: string, content: string): string {
  return `Create a professional social media image for a business post.

Topic: ${title}

The image should:
- Be clean and professional with a modern business aesthetic
- Use a color scheme of blues, whites, and subtle oranges (contractor/insurance industry colors)
- NOT include any text overlays or words in the image
- Feature relevant imagery: contractors, construction equipment, safety gear, or abstract professional graphics
- Be suitable for Facebook, Instagram, and LinkedIn
- Have a 1:1 square aspect ratio
- Look like a premium stock photo or professional marketing asset
- Leave space in the upper-left corner for logo overlay

Style: Corporate, trustworthy, modern, clean
Industry: Insurance for contractors (roofing, HVAC, spray foam, electrical, plumbing)

Do NOT include:
- Any text, words, or letters in the image
- Logos or watermarks
- Cluttered or busy backgrounds`;
}
