import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface BlogTheme {
  domain: string;
  lastUpdated: string;
  colors: {
    background: string;
    text: string;
    headings: string;
    links: string;
    accent: string;
    muted: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
}

const defaultTheme: Omit<BlogTheme, 'domain' | 'lastUpdated'> = {
  colors: {
    background: '#ffffff',
    text: '#1f2937',        // Dark gray text (readable on white)
    headings: '#111827',    // Darker for headings
    links: '#2563eb',       // Blue links
    accent: '#3b82f6',      // Accent color
    muted: '#6b7280'        // Muted text
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    lineHeight: '1.75'
  }
};

/**
 * GET /api/websites/blog-theme?domain=framing-insurance
 * Get blog theme for a domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({
        error: 'Missing domain parameter'
      }, { status: 400 });
    }

    const themePath = path.join(
      '/home/josh/Josh-AI/websites',
      domain,
      'ai/knowledge/blog-theme.json'
    );

    let theme: BlogTheme;

    try {
      const content = await fs.readFile(themePath, 'utf-8');
      theme = JSON.parse(content);
    } catch {
      // Return default theme if no config exists
      theme = {
        domain,
        lastUpdated: new Date().toISOString(),
        ...defaultTheme
      };
    }

    return NextResponse.json(theme);

  } catch (error: any) {
    console.error('[BLOG-THEME] Error:', error);
    return NextResponse.json({
      error: 'Failed to get blog theme',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/websites/blog-theme
 * Save blog theme for a domain
 * Body: { domain: string, colors: {...}, typography?: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, colors, typography } = body;

    if (!domain) {
      return NextResponse.json({
        error: 'Missing domain parameter'
      }, { status: 400 });
    }

    if (!colors) {
      return NextResponse.json({
        error: 'Missing colors parameter'
      }, { status: 400 });
    }

    const themePath = path.join(
      '/home/josh/Josh-AI/websites',
      domain,
      'ai/knowledge/blog-theme.json'
    );

    // Ensure directory exists
    const themeDir = path.dirname(themePath);
    await fs.mkdir(themeDir, { recursive: true });

    const theme: BlogTheme = {
      domain,
      lastUpdated: new Date().toISOString(),
      colors: {
        background: colors.background || defaultTheme.colors.background,
        text: colors.text || defaultTheme.colors.text,
        headings: colors.headings || defaultTheme.colors.headings,
        links: colors.links || defaultTheme.colors.links,
        accent: colors.accent || defaultTheme.colors.accent,
        muted: colors.muted || defaultTheme.colors.muted
      },
      typography: typography || defaultTheme.typography
    };

    await fs.writeFile(themePath, JSON.stringify(theme, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Blog theme saved',
      theme
    });

  } catch (error: any) {
    console.error('[BLOG-THEME] Error:', error);
    return NextResponse.json({
      error: 'Failed to save blog theme',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/websites/blog-theme
 * Update ALL HTML files for a domain with new theme colors
 * Body: { domain: string, slug?: string }
 * If slug is provided, only update that article. Otherwise, update ALL articles.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, slug } = body;

    if (!domain) {
      return NextResponse.json({
        error: 'Missing domain parameter'
      }, { status: 400 });
    }

    // Load theme
    const themePath = path.join(
      '/home/josh/Josh-AI/websites',
      domain,
      'ai/knowledge/blog-theme.json'
    );

    let theme: BlogTheme;
    try {
      const content = await fs.readFile(themePath, 'utf-8');
      theme = JSON.parse(content);
    } catch {
      theme = {
        domain,
        lastUpdated: new Date().toISOString(),
        ...defaultTheme
      };
    }

    const blogResearchDir = path.join(
      '/home/josh/Josh-AI/websites',
      domain,
      'ai/knowledge/10-Blog-research'
    );

    let updatedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    if (slug) {
      // Update single article
      const result = await updateSingleArticle(blogResearchDir, slug, theme);
      if (result.success) {
        updatedCount = 1;
      } else {
        failedCount = 1;
        errors.push(result.error || 'Unknown error');
      }
    } else {
      // Update ALL articles for this domain
      let articleDirs: string[] = [];
      try {
        const entries = await fs.readdir(blogResearchDir, { withFileTypes: true });
        articleDirs = entries
          .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'QC-REPORTS')
          .map(entry => entry.name);
      } catch {
        return NextResponse.json({
          error: 'Blog research directory not found',
          path: blogResearchDir
        }, { status: 404 });
      }

      for (const articleSlug of articleDirs) {
        const result = await updateSingleArticle(blogResearchDir, articleSlug, theme);
        if (result.success) {
          updatedCount++;
        } else {
          failedCount++;
          errors.push(`${articleSlug}: ${result.error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: slug
        ? `Updated theme for ${slug}`
        : `Updated theme for ${updatedCount} articles`,
      domain,
      updatedCount,
      failedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      theme: theme.colors
    });

  } catch (error: any) {
    console.error('[BLOG-THEME] Error:', error);
    return NextResponse.json({
      error: 'Failed to update HTML theme',
      details: error.message
    }, { status: 500 });
  }
}

async function updateSingleArticle(
  blogResearchDir: string,
  slug: string,
  theme: BlogTheme
): Promise<{ success: boolean; error?: string }> {
  const htmlPath = path.join(blogResearchDir, slug, 'article-final.html');

  let htmlContent: string;
  try {
    htmlContent = await fs.readFile(htmlPath, 'utf-8');
  } catch {
    return { success: false, error: 'HTML file not found' };
  }

  // Apply theme colors to HTML
  const updatedHtml = applyThemeToHtml(htmlContent, theme);

  // Save updated HTML
  await fs.writeFile(htmlPath, updatedHtml, 'utf-8');

  // Also update the drafts copy if it exists
  const draftHtmlPath = path.join(blogResearchDir, slug, 'drafts', 'article-v1.html');
  try {
    await fs.writeFile(draftHtmlPath, updatedHtml, 'utf-8');
  } catch {
    // Drafts folder might not exist, that's okay
  }

  return { success: true };
}

function applyThemeToHtml(html: string, theme: BlogTheme): string {
  const { colors, typography } = theme;

  // Replace hardcoded colors in the <style> block directly
  // This ensures the theme colors are actually applied, not just added as variables

  // Replace body color (usually #333 or similar)
  html = html.replace(
    /body\s*\{([^}]*?)color:\s*#[0-9a-fA-F]{3,6}/gi,
    `body {$1color: ${colors.text}`
  );

  // Replace body background color
  html = html.replace(
    /body\s*\{([^}]*?)background-color:\s*#[0-9a-fA-F]{3,6}/gi,
    `body {$1background-color: ${colors.background}`
  );

  // Replace article background
  html = html.replace(
    /article\s*\{([^}]*?)background:\s*(?:white|#(?:fff|ffffff))/gi,
    `article {$1background: ${colors.background}`
  );

  // Replace h2 colors
  html = html.replace(
    /h2\s*\{([^}]*?)color:\s*#[0-9a-fA-F]{3,6}/gi,
    `h2 {$1color: ${colors.headings}`
  );

  // Replace h3 colors
  html = html.replace(
    /h3\s*\{([^}]*?)color:\s*#[0-9a-fA-F]{3,6}/gi,
    `h3 {$1color: ${colors.headings}`
  );

  // Replace strong colors
  html = html.replace(
    /strong\s*\{([^}]*?)color:\s*#[0-9a-fA-F]{3,6}/gi,
    `strong {$1color: ${colors.headings}`
  );

  // Replace link colors in .toc a
  html = html.replace(
    /\.toc\s+a\s*\{([^}]*?)color:\s*#[0-9a-fA-F]{3,6}/gi,
    `.toc a {$1color: ${colors.links}`
  );

  // Replace FAQ question colors
  html = html.replace(
    /\.faq-question\s*\{([^}]*?)color:\s*#[0-9a-fA-F]{3,6}/gi,
    `.faq-question {$1color: ${colors.headings}`
  );

  // Replace header gradient (keep as is or use accent)
  html = html.replace(
    /header\s*\{([^}]*?)background:\s*linear-gradient\([^)]+\)/gi,
    `header {$1background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.links} 100%)`
  );

  // Replace thead background
  html = html.replace(
    /thead\s*\{([^}]*?)background:\s*#[0-9a-fA-F]{3,6}/gi,
    `thead {$1background: ${colors.accent}`
  );

  // Replace h2 border-bottom color
  html = html.replace(
    /border-bottom:\s*3px\s+solid\s+#[0-9a-fA-F]{3,6}/gi,
    `border-bottom: 3px solid ${colors.accent}`
  );

  // Update font family if provided
  if (typography.fontFamily !== 'system-ui, -apple-system, sans-serif') {
    html = html.replace(
      /font-family:\s*'Segoe UI'[^;]+;/gi,
      `font-family: ${typography.fontFamily};`
    );
  }

  // Add a comment to show theme was applied
  if (!html.includes('<!-- Theme applied:')) {
    const themeComment = `<!-- Theme applied: ${new Date().toISOString()} -->\n`;
    html = themeComment + html;
  } else {
    html = html.replace(
      /<!-- Theme applied: [^>]+ -->/,
      `<!-- Theme applied: ${new Date().toISOString()} -->`
    );
  }

  return html;
}
