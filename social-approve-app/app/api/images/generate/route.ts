import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { commitImage, isConfigured as isGitHubConfigured, getImageUrl } from '@/lib/github';
import { getBrandImageConfig, buildPostImagePrompt, BrandImageConfig } from '@/lib/brand-image-config';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for image generation

// Target: 1024x1024, JPEG at 85% quality = ~200-400KB
const IMAGE_MAX_SIZE = 1024;
const JPEG_QUALITY = 85;
const MAX_FILE_SIZE_KB = 500;
const LOGO_SIZE = 180; // Logo size in pixels
const LOGO_PADDING = 30; // Padding from edge (fallback)

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

// Analyze image with Gemini Vision to find optimal logo placement
async function findOptimalLogoPlacement(
  imageBase64: string,
  genAI: GoogleGenAI,
  logoSize: number = LOGO_SIZE
): Promise<{ x: number; y: number; reason: string } | null> {
  try {
    console.log('[ImageGen] Analyzing image for optimal logo placement...');

    const analysisResponse = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
            { text: `Analyze this social media image to find the best location for a company logo.

IMAGE SIZE: 1024x1024 pixels
LOGO SIZE: ${logoSize}x${logoSize} pixels

Find a location where:
1. The logo won't cover important content, faces, or text
2. There's sufficient contrast for visibility (avoid placing on busy areas)
3. It looks professionally placed (corners or edges preferred)
4. Stay within bounds: x must be 0-${1024 - logoSize}, y must be 0-${1024 - logoSize}

Common good positions:
- Top-left corner: x=30, y=30
- Top-right corner: x=${1024 - logoSize - 30}, y=30
- Bottom-left corner: x=30, y=${1024 - logoSize - 30}
- Bottom-right corner: x=${1024 - logoSize - 30}, y=${1024 - logoSize - 30}

But analyze the ACTUAL image content and choose the best spot.

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{"x": <number>, "y": <number>, "reason": "<brief 5-10 word explanation>"}` }
          ]
        }
      ]
    });

    // Extract text response
    const responseText = analysisResponse.candidates?.[0]?.content?.parts?.[0];
    if (!responseText || typeof responseText !== 'object' || !('text' in responseText)) {
      console.error('[ImageGen] No text response from vision analysis');
      return null;
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonText = (responseText as { text: string }).text.trim();
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const placement = JSON.parse(jsonText);

    // Validate coordinates are within bounds
    const maxX = 1024 - logoSize;
    const maxY = 1024 - logoSize;
    placement.x = Math.max(0, Math.min(maxX, Math.round(placement.x)));
    placement.y = Math.max(0, Math.min(maxY, Math.round(placement.y)));

    console.log(`[ImageGen] Optimal logo placement: (${placement.x}, ${placement.y}) - ${placement.reason}`);
    return placement;

  } catch (err) {
    console.error('[ImageGen] Vision analysis failed:', err);
    return null;
  }
}

// Composite logo onto image using Sharp
// Now accepts optional dynamic coordinates from vision analysis
async function compositeLogoOnImage(
  imageBuffer: Buffer,
  config: BrandImageConfig,
  baseUrl: string,
  dynamicPlacement?: { x: number; y: number; reason: string } | null
): Promise<Buffer> {
  if (!config.logoPath) {
    console.log('[ImageGen] No logo configured for brand, skipping composite');
    return imageBuffer;
  }

  try {
    // Fetch the logo via HTTP (serverless can't access filesystem)
    const logoUrl = `${baseUrl}${config.logoPath}`;
    console.log(`[ImageGen] Fetching logo from: ${logoUrl}`);

    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) {
      console.error(`[ImageGen] Failed to fetch logo: ${logoResponse.status}`);
      return imageBuffer;
    }

    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoBuffer = Buffer.from(logoArrayBuffer);

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

    // Use dynamic placement from vision analysis, or fall back to config position
    let left: number;
    let top: number;
    let placementMethod: string;

    if (dynamicPlacement) {
      // Use AI-determined placement
      left = dynamicPlacement.x;
      top = dynamicPlacement.y;
      placementMethod = `AI-optimized (${dynamicPlacement.reason})`;
    } else {
      // Fall back to static position from config
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
      placementMethod = `static ${config.logoPosition || 'top-left'}`;
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

    console.log(`[ImageGen] Logo composited at (${left}, ${top}) - ${placementMethod}`);
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

    // Get base URL for fetching assets (logos, etc.)
    const baseUrl = new URL(request.url).origin;

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

      // Initialize Google GenAI SDK (official SDK, not REST API)
      const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

      // Call Gemini 3 Pro Image using official SDK
      // This properly handles thinking mode which is automatic in Gemini 3
      console.log('[ImageGen] Calling Gemini 3 Pro Image via official SDK...');

      let geminiResponse;
      try {
        geminiResponse = await genAI.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: imagePrompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            // SDK handles thinking automatically - no config needed
          },
        });
      } catch (sdkError) {
        const errorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
        console.error('[Gemini SDK] Error:', errorMessage);

        // Parse specific error types
        if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
          throw new Error('Gemini authentication failed - check API key');
        }
        if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          throw new Error('Gemini rate limit exceeded - try again later');
        }
        if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
          throw new Error('Content blocked by safety filters - modify prompt');
        }

        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      // Extract image from SDK response
      // SDK response format: response.candidates[0].content.parts[]
      const parts = geminiResponse.candidates?.[0]?.content?.parts || [];

      // Find non-thought image parts (thoughts have thought: true)
      // Use 'any' for SDK parts since types may vary between versions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageParts = parts.filter((p: any) => p.inlineData?.data && !p.thought);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalImagePart = imageParts[imageParts.length - 1] as any;

      if (!finalImagePart?.inlineData?.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partTypes = parts.map((p: any) => ({
          hasImage: !!p.inlineData,
          isThought: !!p.thought,
          hasText: !!p.text
        }));
        console.error('[Gemini] No final image. Parts:', JSON.stringify(partTypes));
        throw new Error('No image generated by Gemini');
      }

      // Convert SDK response to base64 string
      // SDK may return Uint8Array, Buffer, or string depending on version
      let rawImageBase64: string;
      const imageData = finalImagePart.inlineData.data;
      if (imageData instanceof Uint8Array || Buffer.isBuffer(imageData)) {
        rawImageBase64 = Buffer.from(imageData).toString('base64');
      } else if (typeof imageData === 'string') {
        rawImageBase64 = imageData;
      } else {
        throw new Error('Unexpected image data format from Gemini');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const thoughtCount = parts.filter((p: any) => p.thought).length;
      console.log(`[ImageGen] Got final image (${thoughtCount} thought images, ${imageParts.length} final images)`);

      // Compress image
      console.log(`[ImageGen] Raw image size: ${Math.round(rawImageBase64.length * 0.75 / 1024)}KB`);
      const { buffer: compressedBuffer } = await compressImage(rawImageBase64);

      // Check if this is an advertisement-style image (has TEXT TO INCLUDE in prompt)
      const isAdvertisementStyle = brandConfig?.styleDescription?.includes('TEXT TO INCLUDE');

      // Composite logo if brand config has one - use AI vision to find optimal placement
      let finalBuffer: Buffer = compressedBuffer;
      let logoPlacement: { x: number; y: number; reason: string } | null = null;

      if (brandConfig && brandConfig.logoPath) {
        // Use Gemini Vision to find optimal logo placement for ALL images
        logoPlacement = await findOptimalLogoPlacement(rawImageBase64, genAI, LOGO_SIZE);
        finalBuffer = await compositeLogoOnImage(compressedBuffer, brandConfig, baseUrl, logoPlacement);
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
        has_logo: !!(brandConfig?.logoPath) && !isAdvertisementStyle,
        is_advertisement_style: isAdvertisementStyle,
        logo_placement: logoPlacement ? {
          x: logoPlacement.x,
          y: logoPlacement.y,
          method: 'AI-optimized',
          reason: logoPlacement.reason,
        } : null,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json(
      {
        error: 'Failed to process image generation request',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
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
