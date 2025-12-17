import { sql } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export interface BrandImageConfig {
  brandId: number;
  brandSlug: string;
  brandName: string;
  shortName: string;

  // Colors extracted from profile
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor: string;

  // Logo info
  logoPath: string | null;  // Path to logo in public folder
  logoUrl: string | null;   // Public URL to logo
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  // Style info for image generation
  industry: string;
  styleDescription: string;
  tagline?: string;

  // Image generation prompt template
  imagePromptTemplate: string;

  // Elements to avoid
  avoidElements: string[];

  // Contact info for overlays
  phone?: string;
  website?: string;
}

interface BrandColors {
  primary: string;
  secondary: string;
  accent?: string;
  background: string;
}

/**
 * Parse colors from CLIENT-PROFILE.md content
 */
function parseColorsFromProfile(profile: string): BrandColors {
  const colors: BrandColors = {
    primary: '#3B82F6', // Default blue
    secondary: '#1F2937', // Default dark gray
    background: '#000000', // Default black
  };

  // Look for color definitions in various formats
  const colorPatterns = [
    /\*\*Primary[:\*]*\s*([^|*\n]+)/i,
    /Primary\s*\|\s*([^\|]+)/i,
    /Cyan\/Teal\s*\|\s*(#[A-Fa-f0-9]{6})/i,
  ];

  for (const pattern of colorPatterns) {
    const match = profile.match(pattern);
    if (match) {
      const colorText = match[1].trim();
      const hexMatch = colorText.match(/#[A-Fa-f0-9]{6}/);
      if (hexMatch) {
        colors.primary = hexMatch[0];
        break;
      }
    }
  }

  // Secondary color
  const secondaryPatterns = [
    /\*\*Secondary[:\*]*\s*([^|*\n]+)/i,
    /Secondary\s*\|\s*([^\|]+)/i,
    /Black\s*\|\s*(#[A-Fa-f0-9]{6})/i,
  ];

  for (const pattern of secondaryPatterns) {
    const match = profile.match(pattern);
    if (match) {
      const colorText = match[1].trim();
      const hexMatch = colorText.match(/#[A-Fa-f0-9]{6}/);
      if (hexMatch) {
        colors.secondary = hexMatch[0];
        break;
      }
    }
  }

  // Background color (often black for social media templates)
  const bgMatch = profile.match(/Background\s*\|\s*([^\|]+)/i);
  if (bgMatch) {
    const hexMatch = bgMatch[1].match(/#[A-Fa-f0-9]{6}/);
    if (hexMatch) {
      colors.background = hexMatch[0];
    }
  }

  return colors;
}

/**
 * Determine industry from brand profile
 */
function determineIndustry(profile: string, brandSlug: string): string {
  const lowerProfile = profile.toLowerCase();

  if (lowerProfile.includes('insulation') || lowerProfile.includes('spray foam')) {
    return 'insulation contractor services';
  }
  if (lowerProfile.includes('insurance') || lowerProfile.includes('contractor insurance')) {
    return 'contractor insurance agency';
  }
  if (lowerProfile.includes('roofing')) {
    return 'roofing contractor services';
  }
  if (lowerProfile.includes('hvac')) {
    return 'HVAC contractor services';
  }

  // Default based on slug patterns
  if (brandSlug.toLowerCase().includes('ica') || brandSlug.toLowerCase().includes('foam')) {
    return 'insulation contractor services';
  }
  if (brandSlug.toLowerCase().includes('cca') || brandSlug.toLowerCase().includes('insurance')) {
    return 'contractor insurance agency';
  }

  return 'professional contractor services';
}

/**
 * Extract tagline from profile
 */
function extractTagline(profile: string): string | undefined {
  const taglinePatterns = [
    /\*\*Tagline[^\*]*\*\*[:\s]*"?([^"\n]+)"?/i,
    /Tagline\/Positioning\s*\n\s*\*\*"([^"]+)"/i,
    /### Taglines?\s*\n\s*-\s*"?([^"\n]+)/i,
  ];

  for (const pattern of taglinePatterns) {
    const match = profile.match(pattern);
    if (match) {
      return match[1].trim().replace(/^"|"$/g, '');
    }
  }

  return undefined;
}

/**
 * Build style description for image generation
 */
function buildStyleDescription(brandSlug: string, profile: string, colors: BrandColors): string {
  const upperSlug = brandSlug.toUpperCase();

  // ICA-specific style (black bg, cyan waves, template look)
  if (upperSlug === 'ICA' || profile.toLowerCase().includes('insulation contractors')) {
    return `Professional template design with black background and flowing ${colors.primary} (cyan/teal) wave graphics.
Modern and sleek with high contrast. The style should feel like a premium marketing template with clean lines and professional contractor branding.`;
  }

  // CCA-specific style (orange accents, professional insurance)
  if (upperSlug === 'CCA' || profile.toLowerCase().includes("contractor's choice")) {
    return `Professional business aesthetic with ${colors.primary} (orange) accents on clean slate/dark gray backgrounds.
Corporate, trustworthy, and modern. The style should convey expertise and reliability in the insurance industry.`;
  }

  // Default professional style
  return `Professional social media template with ${colors.primary} color accents on ${colors.background} background.
Modern, clean design suitable for professional business posts.`;
}

/**
 * Build the complete image generation prompt for a brand
 */
function buildImagePromptTemplate(
  brandName: string,
  industry: string,
  colors: BrandColors,
  styleDescription: string,
  tagline?: string
): string {
  return `Create a professional social media image for ${brandName}, a ${industry} company.

STYLE REQUIREMENTS:
${styleDescription}

COLOR PALETTE:
- Primary accent color: ${colors.primary}
- Secondary color: ${colors.secondary}
- Background: ${colors.background}
${tagline ? `\nCompany tagline for inspiration: "${tagline}"` : ''}

DESIGN RULES:
- Create a visually striking 1:1 square image
- Use the specified color palette prominently
- Modern, professional aesthetic
- DO NOT include any text, words, or letters
- DO NOT include logos or watermarks
- Leave clean space for logo overlay (upper-left corner)
- Focus on abstract professional graphics, patterns, or industry-relevant imagery
- High contrast and visually impactful

The image should look like a premium branded social media template background.`;
}

/**
 * Load brand image configuration from database and profile
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

  // Try to read CLIENT-PROFILE.md
  let profile = '';
  const profilePath = path.join(process.cwd(), 'public', 'clients', upperSlug, 'CLIENT-PROFILE.md');

  try {
    profile = await readFile(profilePath, 'utf-8');
  } catch {
    console.log(`No CLIENT-PROFILE.md found for ${brandSlug}`);
  }

  // Parse colors
  const colors = parseColorsFromProfile(profile);

  // Determine industry
  const industry = determineIndustry(profile, brandSlug);

  // Extract tagline
  const tagline = extractTagline(profile);

  // Build style description
  const styleDescription = buildStyleDescription(brandSlug, profile, colors);

  // Build prompt template
  const imagePromptTemplate = buildImagePromptTemplate(
    brand.name as string,
    industry,
    colors,
    styleDescription,
    tagline
  );

  // Find logo path
  let logoPath: string | null = null;
  let logoUrl: string | null = brand.logo_url as string | null;

  // Check for logo in client folder (try multiple extensions)
  const possibleLogoPaths = [
    `Company-Images/${upperSlug}_Logo.png`,
    `Company-Images/${brandSlug}_Logo.png`,
    'Company-Images/logo.png',
    'Company-Images/logo.jpg',
    'logos/logo.png',
    'logos/logo.jpg',
    'logos/logo.jpeg',
    'logo.png',
    'logo.jpg',
  ];

  // Special case for ICA
  if (upperSlug === 'ICA') {
    possibleLogoPaths.unshift('Company-Images/Insulation_Contractors_Logo_V3.png');
  }

  for (const relativePath of possibleLogoPaths) {
    const fullPath = path.join(process.cwd(), 'public', 'clients', upperSlug, relativePath);
    try {
      await readFile(fullPath);
      logoPath = `/clients/${upperSlug}/${relativePath}`;
      logoUrl = logoPath; // Use the public URL
      break;
    } catch {
      // File doesn't exist, try next
    }
  }

  // Extract phone and website from profile
  let phone: string | undefined;
  let website: string | undefined;

  const phoneMatch = profile.match(/\*\*Phone\*\*\s*\|\s*([^\|]+)/);
  if (phoneMatch) phone = phoneMatch[1].trim();

  const websiteMatch = profile.match(/\*\*Website\*\*\s*\|\s*([^\|\n]+)/);
  if (websiteMatch) website = websiteMatch[1].trim();

  return {
    brandId: brand.id as number,
    brandSlug,
    brandName: brand.name as string,
    shortName: brand.short_name as string,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    backgroundColor: colors.background,
    logoPath,
    logoUrl,
    logoPosition: 'top-left',
    industry,
    styleDescription,
    tagline,
    imagePromptTemplate,
    avoidElements: [
      'text', 'words', 'letters', 'numbers',
      'logos', 'watermarks', 'signatures',
      'human faces', 'realistic people'
    ],
    phone,
    website,
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
