import { sql } from '@/lib/db';

export interface BrandImageConfig {
  brandId: number;
  brandSlug: string;
  brandName: string;
  shortName: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;

  // Logo info
  logoPath: string | null;
  logoUrl: string | null;
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  // Style info
  industry: string;
  styleDescription: string;
  tagline?: string;

  // Image generation prompt
  imagePromptTemplate: string;

  // Contact info
  phone?: string;
  website?: string;
}

// Database image_config JSON structure
interface DbImageConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  logoPath?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  industry?: string;
  tagline?: string;
  styleDescription?: string;
  phone?: string;
  website?: string;
}

// Default values for missing config
const DEFAULTS = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1F2937',
  backgroundColor: '#111827',
  logoPosition: 'top-left' as const,
  industry: 'professional services',
  styleDescription: 'Professional business aesthetic with blue accents on dark backgrounds. Modern, clean design.',
};

/**
 * Build the complete image generation prompt for a brand
 */
function buildImagePromptTemplate(brandName: string, config: DbImageConfig): string {
  const styleDescription = config.styleDescription || '';

  // If styleDescription contains full prompt instructions (advertisement style), use it directly
  if (styleDescription.includes('DESIGN LAYOUT') || styleDescription.includes('TEXT TO INCLUDE')) {
    return styleDescription;
  }

  // Otherwise, use the default template style (stock photo approach)
  const primaryColor = config.primaryColor || DEFAULTS.primaryColor;
  const secondaryColor = config.secondaryColor || DEFAULTS.secondaryColor;
  const backgroundColor = config.backgroundColor || DEFAULTS.backgroundColor;
  const industry = config.industry || DEFAULTS.industry;

  return `Generate a SQUARE 1:1 aspect ratio image (equal width and height).

Create a stunning, high-quality social media image for ${brandName}, a ${industry} company.

BRAND STYLE:
${styleDescription || DEFAULTS.styleDescription}

COLOR SCHEME (use these colors prominently):
- Primary/Accent: ${primaryColor} (use for highlights, glows, key elements)
- Secondary: ${secondaryColor}
- Background base: ${backgroundColor}
${config.tagline ? `\nBrand message: "${config.tagline}"` : ''}

IMAGE REQUIREMENTS:
- Photorealistic quality with professional lighting
- Dynamic composition with depth and visual interest
- Feature relevant industry imagery: construction sites, contractors at work, safety equipment, tools, blueprints, hard hats, or professional business settings
- Rich textures and details
- Cinematic lighting with the accent color (${primaryColor}) as highlights or rim lighting
- Professional stock photo quality
- Clean area in upper-left corner (for logo overlay later)

DO NOT include:
- Any text, words, letters, or numbers
- Logos or watermarks
- Faces (show workers from behind or silhouettes)

Create an image that would make someone stop scrolling - visually striking, professional, and memorable.`;
}

/**
 * Load brand image configuration from database
 */
export async function getBrandImageConfig(brandId: number): Promise<BrandImageConfig | null> {
  // Get brand from database including image_config
  const brandResult = await sql`
    SELECT id, slug, name, short_name, website_url, logo_url, image_config
    FROM brands WHERE id = ${brandId}
  `;

  if (brandResult.length === 0) {
    return null;
  }

  const brand = brandResult[0];
  const brandSlug = brand.slug as string;

  // Parse image_config from database (JSONB returns as object)
  const dbConfig: DbImageConfig = (brand.image_config as DbImageConfig) || {};

  // Build the prompt template
  const imagePromptTemplate = buildImagePromptTemplate(brand.name as string, dbConfig);

  return {
    brandId: brand.id as number,
    brandSlug,
    brandName: brand.name as string,
    shortName: brand.short_name as string,
    primaryColor: dbConfig.primaryColor || DEFAULTS.primaryColor,
    secondaryColor: dbConfig.secondaryColor || DEFAULTS.secondaryColor,
    backgroundColor: dbConfig.backgroundColor || DEFAULTS.backgroundColor,
    logoPath: dbConfig.logoPath || null,
    logoUrl: dbConfig.logoPath || null,
    logoPosition: dbConfig.logoPosition || DEFAULTS.logoPosition,
    industry: dbConfig.industry || DEFAULTS.industry,
    styleDescription: dbConfig.styleDescription || DEFAULTS.styleDescription,
    tagline: dbConfig.tagline,
    imagePromptTemplate,
    phone: dbConfig.phone,
    website: dbConfig.website,
  };
}

/**
 * Get brand image config by slug
 */
export async function getBrandImageConfigBySlug(slug: string): Promise<BrandImageConfig | null> {
  const brandResult = await sql`
    SELECT id FROM brands WHERE LOWER(slug) = LOWER(${slug})
  `;

  if (brandResult.length === 0) {
    return null;
  }

  return getBrandImageConfig(brandResult[0].id as number);
}

/**
 * Build the final prompt for a specific post
 */
export function buildPostImagePrompt(
  config: BrandImageConfig,
  postTitle: string,
  postContent: string,
  customPrompt?: string
): string {
  if (customPrompt) {
    // Merge custom prompt with brand requirements
    return `Generate a SQUARE 1:1 aspect ratio image (equal width and height).

${customPrompt}

BRAND REQUIREMENTS (must follow):
- Color palette: ${config.primaryColor} (primary), ${config.secondaryColor} (secondary), ${config.backgroundColor} (background)
- Style: ${config.styleDescription}
- DO NOT include any text, words, logos, or watermarks
- Leave clean space in upper-left for logo overlay`;
  }

  // Check if this is an advertisement-style template (has text instructions)
  const isAdvertisementStyle = config.imagePromptTemplate.includes('TEXT TO INCLUDE') ||
                                config.imagePromptTemplate.includes('DESIGN LAYOUT');

  if (isAdvertisementStyle) {
    // Create short headline from post title (max 4 words, uppercase)
    const headline = postTitle
      .split(' ')
      .slice(0, 4)
      .join(' ')
      .toUpperCase();

    // Extract a short tagline from content (first sentence or phrase)
    const tagline = postContent
      .split(/[.!?\n]/)[0]
      .substring(0, 50)
      .trim();

    return `${config.imagePromptTemplate}

HEADLINE TEXT FOR THIS POST:
"${headline}"

SUBTEXT/TAGLINE:
"${tagline}"

TOPIC CONTEXT:
${postContent.substring(0, 200)}

Generate a professional marketing advertisement with these text elements prominently displayed.`;
  }

  // Default: stock photo style prompt
  return `${config.imagePromptTemplate}

SPECIFIC TOPIC FOR THIS IMAGE:
"${postTitle}"

${postContent.substring(0, 300)}

Think about what visual elements would best represent this topic. Consider:
- What objects, scenes, or scenarios relate to this topic?
- How can the brand colors (${config.primaryColor}) be incorporated naturally?
- What composition would be most impactful?

Generate a compelling, scroll-stopping image that captures the essence of this topic.`;
}
