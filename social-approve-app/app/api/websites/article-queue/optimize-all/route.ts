import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

interface OptimizationResult {
  articleId: string;
  originalTitle: string;
  optimizedTitle: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/websites/article-queue/optimize-all
 *
 * Optimizes all article titles in the queue via VPS API.
 */
export async function POST(request: NextRequest) {
  try {
    const { domain, articles } = await request.json();

    if (!domain || !articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: 'domain and articles array are required' },
        { status: 400 }
      );
    }

    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles to optimize' },
        { status: 400 }
      );
    }

    const results: OptimizationResult[] = [];

    // Optimize each article sequentially
    for (const article of articles) {
      try {
        // Small delay between requests
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const response = await fetch(`${VPS_API_URL}/api/website-content/${encodeURIComponent(domain)}/optimize-title`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: article.articleId,
            currentTitle: article.currentTitle,
            targetKeyword: article.targetKeyword
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          results.push({
            articleId: article.articleId,
            originalTitle: article.currentTitle,
            optimizedTitle: data.optimizedTitle,
            success: true
          });
        } else {
          results.push({
            articleId: article.articleId,
            originalTitle: article.currentTitle,
            optimizedTitle: article.currentTitle,
            success: false,
            error: data.error || 'Unknown error'
          });
        }
      } catch (error) {
        results.push({
          articleId: article.articleId,
          originalTitle: article.currentTitle,
          optimizedTitle: article.currentTitle,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: articles.length,
        successful: successCount,
        failed: failureCount
      },
      message: `Optimized ${successCount} of ${articles.length} articles successfully`
    });
  } catch (error) {
    console.error('Error in batch optimization:', error);
    return NextResponse.json(
      { error: 'Failed to optimize articles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
