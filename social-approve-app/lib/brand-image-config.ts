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
  const primaryColor = config.primaryColor || DEFAULTS.primaryColor;
  const secondaryColor = config.secondaryColor || DEFAULTS.secondaryColor;
  const backgroundColor = config.backgroundColor || DEFAULTS.backgroundColor;
  const industry = config.industry || DEFAULTS.industry;
  const styleDescription = config.styleDescription || DEFAULTS.styleDescription;

  return `Create a professional social media image for ${brandName}, a ${industry} company.

STYLE REQUIREMENTS:
${styleDescription}

COLOR PALETTE:
- Primary accent color: ${primaryColor}
- Secondary color: ${secondaryColor}
- Background: ${backgroundColor}
${config.tagline ? `\nCompany tagline for inspiration: "${config.tagline}"` : ''}

DESIGN RULES:
- Create a visually striking 1:1 square image
- Use the specified color palette prominently
- Modern, professional aesthetic
- DO NOT include any text, words, or letters
- DO NOT include logos or watermarks
- Leave clean space in upper-left corner for logo overlay
- Focus on abstract professional graphics, patterns, or industry-relevant imagery
- High contrast and visually impactful

The image should look like a premium branded social media template background.`;
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
    return `${customPrompt}

BRAND REQUIREMENTS (must follow):
- Color palette: ${config.primaryColor} (primary), ${config.secondaryColor} (secondary), ${config.backgroundColor} (background)
- Style: ${config.styleDescription}
- DO NOT include any text, words, logos, or watermarks
- Leave clean space in upper-left for logo overlay`;
  }

  // Build prompt from template + post context
  return `${config.imagePromptTemplate}

POST CONTEXT:
Topic: ${postTitle}
${postContent.substring(0, 200)}...

Create an image that visually represents this topic while maintaining the brand style.
The image should be abstract/professional - not a literal representation.`;
}
