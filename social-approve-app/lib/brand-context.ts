import { sql } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export interface SiteUrl {
  name: string;
  url: string;
  useFor: string;
}

export interface BrandContext {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  website_url: string | null;
  oneup_category_id: number | null;
  // From CLIENT-PROFILE.md
  profile: string | null;
  // Parsed key info for the prompt
  companyInfo: {
    owner?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    hours?: string;
  };
  services: string[];
  serviceAreas: string;
  siteUrls: {
    mainPages: SiteUrl[];
    servicePages: SiteUrl[];
    specialtyPages: SiteUrl[];
    blogPosts: SiteUrl[];
  };
  brandGuidelines: {
    taglines: string[];
    keyMessages: string[];
    uniqueSellingPoints: string[];
    hashtags: string[];
  };
  contentStrategy: string[];
}

/**
 * Load brand context from database and CLIENT-PROFILE.md file
 */
export async function getBrandContext(brandSlug: string): Promise<BrandContext | null> {
  // Get brand from database
  const brandResult = await sql`
    SELECT id, slug, name, short_name, website_url, oneup_category_id
    FROM brands WHERE LOWER(slug) = LOWER(${brandSlug})
  `;

  if (brandResult.length === 0) {
    return null;
  }

  const brand = brandResult[0];

  // Try to read CLIENT-PROFILE.md
  let profile: string | null = null;
  const profilePath = path.join(process.cwd(), 'public', 'clients', brand.slug.toUpperCase(), 'CLIENT-PROFILE.md');

  try {
    profile = await readFile(profilePath, 'utf-8');
  } catch (e) {
    // File doesn't exist, that's okay
    console.log(`No CLIENT-PROFILE.md found for ${brand.slug}`);
  }

  // Parse key info from profile
  const context: BrandContext = {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    short_name: brand.short_name,
    website_url: brand.website_url,
    oneup_category_id: brand.oneup_category_id,
    profile,
    companyInfo: {},
    services: [],
    serviceAreas: '',
    siteUrls: {
      mainPages: [],
      servicePages: [],
      specialtyPages: [],
      blogPosts: [],
    },
    brandGuidelines: {
      taglines: [],
      keyMessages: [],
      uniqueSellingPoints: [],
      hashtags: [],
    },
    contentStrategy: [],
  };

  if (profile) {
    // Parse company info
    const ownerMatch = profile.match(/\*\*Owner\/Contact\*\*\s*\|\s*([^\|]+)/);
    if (ownerMatch) context.companyInfo.owner = ownerMatch[1].trim();

    const phoneMatch = profile.match(/\*\*Phone\*\*\s*\|\s*([^\|]+)/);
    if (phoneMatch) context.companyInfo.phone = phoneMatch[1].trim();

    const emailMatch = profile.match(/\*\*Email\*\*\s*\|\s*([^\|]+)/);
    if (emailMatch) context.companyInfo.email = emailMatch[1].trim();

    const addressMatch = profile.match(/\*\*Address\*\*\s*\|\s*([^\|]+)/);
    if (addressMatch) context.companyInfo.address = addressMatch[1].trim();

    const websiteMatch = profile.match(/\*\*Website\*\*\s*\|\s*([^\|]+)/);
    if (websiteMatch) context.companyInfo.website = websiteMatch[1].trim();

    const hoursMatch = profile.match(/\*\*Hours\*\*\s*\|\s*([^\|]+)/);
    if (hoursMatch) context.companyInfo.hours = hoursMatch[1].trim();

    // Parse services (lines starting with -)
    const servicesSection = profile.match(/## Services Offered\s*([\s\S]*?)(?=\n##|$)/);
    if (servicesSection) {
      context.services = servicesSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
    }

    // Parse service areas
    const areasSection = profile.match(/## Service Areas\s*([\s\S]*?)(?=\n##|$)/);
    if (areasSection) {
      context.serviceAreas = areasSection[1].trim();
    }

    // Parse taglines
    const taglinesSection = profile.match(/### Taglines\s*([\s\S]*?)(?=\n###|$)/);
    if (taglinesSection) {
      context.brandGuidelines.taglines = taglinesSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*"?|"?\s*$/g, '').trim());
    }

    // Parse key messaging points
    const keyMessagesSection = profile.match(/### Key Messaging Points\s*([\s\S]*?)(?=\n###|$)/);
    if (keyMessagesSection) {
      context.brandGuidelines.keyMessages = keyMessagesSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
    }

    // Parse unique selling points
    const uspSection = profile.match(/### Unique Selling Points\s*([\s\S]*?)(?=\n###|\n##|$)/);
    if (uspSection) {
      context.brandGuidelines.uniqueSellingPoints = uspSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
    }

    // Parse hashtags
    const hashtagsSection = profile.match(/### Hashtags\s*([\s\S]*?)(?=\n###|\n##|$)/);
    if (hashtagsSection) {
      const hashtagLine = hashtagsSection[1].trim();
      context.brandGuidelines.hashtags = hashtagLine.match(/#\w+/g) || [];
    }

    // Parse content themes
    const contentSection = profile.match(/### Content Themes\s*([\s\S]*?)(?=\n###|$)/);
    if (contentSection) {
      context.contentStrategy = contentSection[1]
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*-?\s*/, '').trim());
    }

    // Parse URL tables
    const parseUrlTable = (sectionName: string): SiteUrl[] => {
      const regex = new RegExp(`### ${sectionName}\\s*\\|[^|]+\\|[^|]+\\|[^|]+\\|\\s*\\|[-|]+\\|([\\s\\S]*?)(?=\\n###|\\n##|$)`);
      const match = profile.match(regex);
      if (!match) return [];

      return match[1]
        .split('\n')
        .filter(line => line.trim().startsWith('|'))
        .map(line => {
          const cols = line.split('|').map(c => c.trim()).filter(c => c);
          if (cols.length >= 3) {
            return {
              name: cols[0],
              url: cols[1],
              useFor: cols[2]
            };
          }
          return null;
        })
        .filter((item): item is SiteUrl => item !== null);
    };

    context.siteUrls.mainPages = parseUrlTable('Main Pages');
    context.siteUrls.servicePages = parseUrlTable('Service Pages');
    context.siteUrls.specialtyPages = parseUrlTable('Specialty Pages');
    context.siteUrls.blogPosts = parseUrlTable('Blog Posts');
  }

  return context;
}

/**
 * Generate a prompt section for the brand context
 */
export function formatBrandContextForPrompt(context: BrandContext): string {
  const sections: string[] = [];

  sections.push(`Company: ${context.name}`);

  if (context.companyInfo.website) {
    sections.push(`Website: ${context.companyInfo.website}`);
  }

  if (context.companyInfo.phone) {
    sections.push(`Phone: ${context.companyInfo.phone}`);
  }

  if (context.serviceAreas) {
    sections.push(`Service Areas: ${context.serviceAreas}`);
  }

  if (context.services.length > 0) {
    sections.push(`Services: ${context.services.join(', ')}`);
  }

  if (context.brandGuidelines.taglines.length > 0) {
    sections.push(`Taglines: ${context.brandGuidelines.taglines.join(' | ')}`);
  }

  if (context.brandGuidelines.keyMessages.length > 0) {
    sections.push(`Key Messages:\n- ${context.brandGuidelines.keyMessages.join('\n- ')}`);
  }

  if (context.brandGuidelines.uniqueSellingPoints.length > 0) {
    sections.push(`Unique Selling Points:\n- ${context.brandGuidelines.uniqueSellingPoints.join('\n- ')}`);
  }

  if (context.brandGuidelines.hashtags.length > 0) {
    sections.push(`Recommended Hashtags: ${context.brandGuidelines.hashtags.join(' ')}`);
  }

  if (context.contentStrategy.length > 0) {
    sections.push(`Content Themes: ${context.contentStrategy.join(', ')}`);
  }

  // Add website URLs for linking
  const allUrls = [
    ...context.siteUrls.mainPages,
    ...context.siteUrls.servicePages,
    ...context.siteUrls.specialtyPages,
    ...context.siteUrls.blogPosts,
  ];

  if (allUrls.length > 0) {
    sections.push(`\nWEBSITE PAGES - Link to relevant pages in posts:`);

    if (context.siteUrls.servicePages.length > 0) {
      sections.push(`Service Pages:`);
      context.siteUrls.servicePages.forEach(url => {
        sections.push(`  - ${url.name}: ${url.url} (use for: ${url.useFor})`);
      });
    }

    if (context.siteUrls.specialtyPages.length > 0) {
      sections.push(`Specialty Pages:`);
      context.siteUrls.specialtyPages.forEach(url => {
        sections.push(`  - ${url.name}: ${url.url} (use for: ${url.useFor})`);
      });
    }

    if (context.siteUrls.blogPosts.length > 0) {
      sections.push(`Blog Posts:`);
      context.siteUrls.blogPosts.forEach(url => {
        sections.push(`  - ${url.name}: ${url.url} (use for: ${url.useFor})`);
      });
    }

    if (context.siteUrls.mainPages.length > 0) {
      sections.push(`Main Pages:`);
      context.siteUrls.mainPages.forEach(url => {
        sections.push(`  - ${url.name}: ${url.url} (use for: ${url.useFor})`);
      });
    }
  }

  return sections.join('\n');
}
