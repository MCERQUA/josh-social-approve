import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to directory mapping for websites with non-standard folder names
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA'
};

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
 * Optimizes all article titles in the queue using Claude Code.
 * Returns a stream of results as each title is optimized.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, articles } = body;

    if (!domain || !articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, articles (array)' },
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
    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const topicalMapPath = path.join(
      WEBSITES_DIR,
      websiteDir,
      'ai/knowledge/04-content-strategy/ready/topical-map.json'
    );

    // Load topical map once
    const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(jsonContent);

    // Optimize each article sequentially
    for (const article of articles) {
      try {
        // Small delay between requests to avoid overwhelming Claude
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const optimizedTitle = await optimizeTitle(
          article.currentTitle,
          article.targetKeyword
        );

        // Update the topical map
        let articleFound = false;

        for (const pillar of topicalMap.pillars) {
          if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
            continue;
          }

          for (const art of pillar.supportingArticles) {
            const generatedId = `${pillar.id}-${slugify(art.title || art.id)}`;

            if (generatedId === article.articleId) {
              art.title = optimizedTitle;
              articleFound = true;
              break;
            }
          }

          if (articleFound) break;
        }

        results.push({
          articleId: article.articleId,
          originalTitle: article.currentTitle,
          optimizedTitle,
          success: true
        });

      } catch (error) {
        console.error(`Error optimizing article ${article.articleId}:`, error);
        results.push({
          articleId: article.articleId,
          originalTitle: article.currentTitle,
          optimizedTitle: article.currentTitle,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Write updated topical map back to file
    await fs.writeFile(
      topicalMapPath,
      JSON.stringify(topicalMap, null, 2),
      'utf-8'
    );

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
      {
        error: 'Failed to optimize articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Optimizes a single title using Gemini API
 */
async function optimizeTitle(currentTitle: string, targetKeyword: string): Promise<string> {
  const prompt = `You are an expert SEO copywriter and content strategist. Your task is to optimize an article title to maximize click-through rate while maintaining SEO value.

CURRENT TITLE: "${currentTitle}"
TARGET KEYWORD: "${targetKeyword}"

REQUIREMENTS:
1. **Must include the target keyword "${targetKeyword}"** (or a very close variation)
2. Make the title MORE compelling and enticing to click
3. Use proven copywriting techniques (curiosity, benefit-driven, power words)
4. Keep it under 60 characters for optimal SEO
5. Make it more specific and actionable than the current version
6. Maintain professionalism appropriate for insurance/contractor industry

EXAMPLE TRANSFORMATIONS:
- "Spray Foam Insurance Guide" → "Complete Spray Foam Insurance Guide: Protect Your Business in 2025"
- "Roofing Contractor Coverage" → "Essential Roofing Contractor Insurance: What You Must Know"
- "HVAC Business Protection" → "HVAC Insurance Checklist: 7 Critical Coverages for Your Business"

YOUR TASK:
Provide ONLY the optimized title (no explanation, no quotes, just the title text).

OPTIMIZED TITLE:`;

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
    }

    const optimizedTitle = data.candidates[0].content.parts[0].text.trim();

    // Remove common prefixes if present
    let cleanedTitle = optimizedTitle
      .replace(/^(OPTIMIZED TITLE:|Here (?:is|'s) the optimized title:?|Title:)\s*/i, '')
      .replace(/^["']|["']$/g, '') // Remove quotes if present
      .trim();

    if (!cleanedTitle || cleanedTitle.length < 10) {
      throw new Error('Could not extract valid optimized title from Claude response');
    }

    // Validate the optimized title contains the keyword
    const titleLower = cleanedTitle.toLowerCase();
    const keywordLower = targetKeyword.toLowerCase();

    if (!titleLower.includes(keywordLower)) {
      // Try to intelligently add the keyword
      cleanedTitle = `${targetKeyword}: ${cleanedTitle}`;
    }

    return cleanedTitle;

  } catch (error) {
    throw error;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\//g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
