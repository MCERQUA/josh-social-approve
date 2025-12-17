# Gemini 3 Pro Image Generation Guide

## Overview

JAM Social uses **gemini-3-pro-image-preview** for generating social media images. This document covers the API, capabilities, and our hybrid approach for brand-specific image creation.

---

## Model Information

| Property | Value |
|----------|-------|
| Model ID | `gemini-3-pro-image-preview` |
| Context Window | 65k input / 32k output |
| Knowledge Cutoff | January 2025 |
| Pricing | $2/1M tokens (text input), $0.134 per image output |
| Max Resolution | 4K |

---

## API Format

### Basic Image Generation

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{"text": "Your image prompt here"}]
    }],
    "generationConfig": {
      "imageConfig": {
        "aspectRatio": "1:1",
        "imageSize": "1K"
      }
    }
  }'
```

### Response Format

```json
{
  "candidates": [{
    "content": {
      "parts": [
        {
          "text": "Description of generated image...",
          "thoughtSignature": "<signature>"
        },
        {
          "inlineData": {
            "mimeType": "image/png",
            "data": "base64-encoded-image-data"
          },
          "thoughtSignature": "<signature>"
        }
      ]
    }
  }]
}
```

### Extract Image from Response (JavaScript/TypeScript)

```typescript
const geminiData = await geminiResponse.json();
const parts = geminiData.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find((p) => p.inlineData?.data);
const base64Image = imagePart?.inlineData?.data;
```

---

## Image Configuration Options

### Aspect Ratios
- `1:1` - Square (Instagram, Facebook posts)
- `16:9` - Landscape (YouTube thumbnails, Twitter headers)
- `9:16` - Portrait (Stories, Reels, TikTok)
- `4:3` - Standard
- `3:2` - Photo standard

### Image Sizes
- `1K` - 1024x1024 (recommended for social media)
- `2K` - 2048x2048
- `4K` - 4096x4096 (highest quality, more expensive)

**JAM Social Default:** `1K` at `1:1` aspect ratio for optimal social media performance and cost efficiency.

---

## Capabilities

### What Gemini 3 Pro Image CAN Do

1. **Generate images from text prompts**
   - Professional graphics, backgrounds, abstract designs
   - Brand-colored visual elements
   - Industry-specific imagery

2. **Render text in images**
   - Headlines, captions, infographics
   - Clean, legible text at high resolutions

3. **Conversational editing (multi-turn)**
   - "Make the background darker"
   - "Add more orange accents"
   - Requires thought signatures for context

4. **Google Search grounding**
   - Real-time data visualization
   - Current weather, stocks, events

5. **Image editing with user-provided images**
   - Style transfer
   - Background replacement
   - Element addition/removal

### What Gemini 3 Pro Image CANNOT Reliably Do

1. **Exact logo placement** - AI interprets and regenerates, doesn't "paste"
2. **Pixel-perfect compositing** - Use Sharp for precise overlays
3. **Exact font matching** - Use Sharp/Canvas for brand fonts
4. **Image segmentation** - Use Gemini 2.5 Flash instead

---

## JAM Social Hybrid Approach

For reliable, brand-consistent social media images, we use a **hybrid approach**:

### Pipeline

```
1. Gemini 3 Pro Image → Generate branded background/graphic
2. Sharp → Compress to target size (1K, JPEG 85%)
3. Sharp → Composite logo at exact position
4. Sharp → Final compression
5. GitHub → Commit image
6. Netlify → Deploy
```

### Why Hybrid?

| Task | Tool | Reason |
|------|------|--------|
| Generate background | Gemini 3 | Creative, brand-colored graphics |
| Logo placement | Sharp | Exact position, no interpretation |
| Text overlay | Sharp/Canvas | Exact fonts, colors, positioning |
| Image compression | Sharp | Consistent file sizes |

---

## Brand Configuration

Each brand has image generation settings stored in the database:

```json
{
  "primaryColor": "#F97316",
  "secondaryColor": "#64748B",
  "backgroundColor": "#1F2937",
  "logoPath": "/clients/CCA/logos/logo.jpg",
  "logoPosition": "top-left",
  "industry": "contractor insurance agency",
  "tagline": "Insurance Built for Contractors",
  "styleDescription": "Professional business aesthetic with orange accents..."
}
```

### Logo Positions
- `top-left` (default)
- `top-right`
- `bottom-left`
- `bottom-right`

---

## Working with User-Provided Images

### Scenario: Business Truck Photo for Social Ad

For cases where you want to use a **real photo** (truck, jobsite, crew) with logo/text overlays:

#### Option 1: Sharp-Only Pipeline (Recommended for Exact Results)

```typescript
import sharp from 'sharp';

async function createSocialAdFromPhoto(
  photoPath: string,
  logoPath: string,
  headline: string
) {
  // 1. Load and resize photo
  const photo = await sharp(photoPath)
    .resize(1024, 1024, { fit: 'cover' })
    .toBuffer();

  // 2. Load and resize logo
  const logo = await sharp(logoPath)
    .resize(180, 180, { fit: 'inside' })
    .toBuffer();

  // 3. Composite logo onto photo
  const withLogo = await sharp(photo)
    .composite([
      {
        input: logo,
        left: 30,
        top: 30
      }
    ])
    .toBuffer();

  // 4. Add text overlay (requires svg or canvas)
  // See text overlay section below

  return withLogo;
}
```

#### Option 2: Gemini Enhancement + Sharp Compositing

Use Gemini to enhance/stylize the photo, then Sharp for precise logo/text:

```typescript
// 1. Send photo to Gemini for enhancement
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Enhance this business truck photo for a professional social media ad. Keep the truck as the focus. Add subtle professional lighting effects." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Photo
            }
          }
        ]
      }],
      generationConfig: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K'
        }
      }
    })
  }
);

// 2. Extract enhanced image
const enhancedBase64 = extractImageFromResponse(geminiResponse);

// 3. Use Sharp to add logo and text (exact positioning)
const finalImage = await sharp(Buffer.from(enhancedBase64, 'base64'))
  .composite([
    { input: logoBuffer, left: 30, top: 30 },
    { input: textOverlaySvg, left: 0, top: 800 }
  ])
  .jpeg({ quality: 85 })
  .toBuffer();
```

---

## Text Overlay with Sharp + SVG

For precise text rendering, create SVG overlays:

```typescript
function createTextOverlaySvg(
  text: string,
  width: number,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
  }
) {
  const {
    fontSize = 48,
    fontFamily = 'Arial, sans-serif',
    color = '#FFFFFF',
    backgroundColor = 'rgba(0,0,0,0.7)'
  } = options;

  return Buffer.from(`
    <svg width="${width}" height="${fontSize * 2}">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        fill="${color}"
      >${text}</text>
    </svg>
  `);
}

// Usage
const textOverlay = createTextOverlaySvg(
  "Your Trusted Insurance Partner",
  1024,
  { fontSize: 42, color: '#F97316' }
);

const finalImage = await sharp(photoBuffer)
  .composite([
    { input: logoBuffer, left: 30, top: 30 },
    { input: textOverlay, left: 0, top: 900, gravity: 'south' }
  ])
  .toBuffer();
```

---

## Thought Signatures (Multi-Turn Editing)

For conversational image editing, you MUST preserve thought signatures:

```typescript
// Turn 1: Generate initial image
const response1 = await generateImage("Create a blue background");
const signature1 = response1.candidates[0].content.parts[0].thoughtSignature;
const imageSignature1 = response1.candidates[0].content.parts[1].thoughtSignature;

// Turn 2: Edit the image (must include signatures)
const response2 = await fetch(apiUrl, {
  body: JSON.stringify({
    contents: [
      // Previous turn
      { role: "user", parts: [{ text: "Create a blue background" }] },
      {
        role: "model",
        parts: [
          { text: "...", thoughtSignature: signature1 },
          { inlineData: {...}, thoughtSignature: imageSignature1 }
        ]
      },
      // New request
      { role: "user", parts: [{ text: "Make it orange instead" }] }
    ],
    generationConfig: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  })
});
```

**Important:** Missing signatures will cause 400 errors for image editing.

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 - Missing thoughtSignature | Multi-turn without signatures | Include all signatures from previous turns |
| 400 - Invalid imageSize | Wrong size value | Use: 1K, 2K, or 4K |
| 403 - Safety filter | Content blocked | Adjust prompt, avoid people/faces |
| 404 - Model not found | Wrong model ID | Use `gemini-3-pro-image-preview` |
| 429 - Rate limit | Too many requests | Implement retry with backoff |

### Safety Filters

Gemini 3 may block generation for:
- Explicit content
- Violence
- Copyrighted characters
- Real people's faces

For business photos with people, test thoroughly and have fallback options.

---

## Cost Optimization

### Tips

1. **Use 1K for social media** - 2K/4K unnecessary, costs more
2. **Cache generated images** - Don't regenerate same content
3. **Batch similar requests** - Same brand config = similar prompts
4. **Use JPEG output** - Smaller files, faster processing

### Approximate Costs

| Resolution | Approx. Cost per Image |
|------------|------------------------|
| 1K | ~$0.04 |
| 2K | ~$0.08 |
| 4K | ~$0.13 |

---

## Implementation in JAM Social

### Current Flow (`/api/images/generate`)

1. Receive post_id
2. Load brand config from database
3. Build prompt with brand colors/style
4. Call Gemini 3 Pro Image API
5. Compress with Sharp (1024px, JPEG 85%)
6. Composite logo with Sharp
7. Final compression
8. Commit to GitHub
9. Update database with filename
10. Netlify deploys automatically

### Files

- `/app/api/images/generate/route.ts` - Main generation endpoint
- `/lib/brand-image-config.ts` - Brand config loading
- `/lib/github.ts` - GitHub commit functions

---

## Future Enhancements

### Planned Features

1. **User photo upload** - Upload truck/jobsite photos for ad creation
2. **Template system** - Pre-designed layouts with placeholder regions
3. **Text overlay editor** - UI for positioning text/logos
4. **Batch generation** - Generate multiple variants
5. **A/B testing** - Track which images perform better

### API Wishlist

- Real-time preview (streaming image generation)
- Fine-tuned brand models
- Template-based generation

---

## References

- [Gemini 3 Official Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Pricing](https://ai.google.dev/gemini-api/docs/pricing)

---

*Last Updated: December 17, 2025*
