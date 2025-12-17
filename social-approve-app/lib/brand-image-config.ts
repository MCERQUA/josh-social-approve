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

// Hardcoded brand configurations for reliable serverless execution
const BRAND_CONFIGS: Record<string, Omit<BrandImageConfig, 'brandId' | 'brandSlug' | 'brandName' | 'shortName'>> = {
  'ICA': {
    primaryColor: '#00CED1', // Cyan/Teal
    secondaryColor: '#000000', // Black
    backgroundColor: '#000000',
    logoPath: '/clients/ICA/Company-Images/Insulation_Contractors_Logo_V3.png',
    logoUrl: '/clients/ICA/Company-Images/Insulation_Contractors_Logo_V3.png',
    logoPosition: 'top-left',
    industry: 'insulation contractor services',
    tagline: "Arizona's Extreme Heat Specialists",
    styleDescription: `Professional template design with black background and flowing cyan (#00CED1) wave graphics.
Modern and sleek with high contrast. Premium marketing template style with clean lines and professional contractor branding.
The cyan color should be prominent as accent waves or flowing graphic elements.`,
    imagePromptTemplate: '',
    phone: '623-241-1939',
    website: 'insulationcontractorsofarizona.com',
  },
  'CCA': {
    primaryColor: '#F97316', // Orange
    secondaryColor: '#64748B', // Slate
    backgroundColor: '#1F2937', // Dark slate
    logoPath: '/clients/CCA/logos/logo.jpg',
    logoUrl: '/clients/CCA/logos/logo.jpg',
    logoPosition: 'top-left',
    industry: 'contractor insurance agency',
    tagline: 'Insurance Built for Contractors',
    styleDescription: `Professional business aesthetic with orange (#F97316) accents on clean dark slate backgrounds.
Corporate, trustworthy, and modern design. The style should convey expertise and reliability in the insurance industry.
Use orange as accent color for highlights and graphic elements.`,
    imagePromptTemplate: '',
    phone: '(480) 535-5880',
    website: 'contractorschoiceagency.com',
  },
};

// Default config for unknown brands
const DEFAULT_CONFIG: Omit<BrandImageConfig, 'brandId' | 'brandSlug' | 'brandName' | 'shortName'> = {
  primaryColor: '#3B82F6', // Blue
  secondaryColor: '#1F2937', // Dark gray
  backgroundColor: '#111827',
  logoPath: null,
  logoUrl: null,
  logoPosition: 'top-left',
  industry: 'professional services',
  styleDescription: 'Professional business aesthetic with blue accents on dark backgrounds. Modern, clean design.',
  imagePromptTemplate: '',
  phone: undefined,
  website: undefined,
};

/**
 * Build the complete image generation prompt for a brand
 */
function buildImagePromptTemplate(
  brandName: string,
  config: Omit<BrandImageConfig, 'brandId' | 'brandSlug' | 'brandName' | 'shortName' | 'imagePromptTemplate'>
): string {
  return `Create a professional social media image for ${brandName}, a ${config.industry} company.

STYLE REQUIREMENTS:
${config.styleDescription}

COLOR PALETTE:
- Primary accent color: ${config.primaryColor}
- Secondary color: ${config.secondaryColor}
- Background: ${config.backgroundColor}
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
 * Load brand image configuration
 */
export async function getBrandImageConfig(brandId: number): Promise<BrandImageConfig | null> {
  // Get brand from database
  const brandResult = await sql`
    SELECT id, slug, name, short_name, website_url, logo_url
    FROM brands WHERE id = ${brandId}
  `;

  if (brandResult.length === 0) {
    return null;
  }

  const brand = brandResult[0];
  const brandSlug = brand.slug as string;
  const upperSlug = brandSlug.toUpperCase();

  // Get brand-specific config or default
  const config = BRAND_CONFIGS[upperSlug] || DEFAULT_CONFIG;

  // Build the prompt template
  const imagePromptTemplate = buildImagePromptTemplate(
    brand.name as string,
    config
  );

  return {
    brandId: brand.id as number,
    brandSlug,
    brandName: brand.name as string,
    shortName: brand.short_name as string,
    ...config,
    imagePromptTemplate,
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
