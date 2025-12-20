import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to directory mapping for websites with non-standard folder names
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA'
};

/**
 * POST /api/websites/article-queue/optimize-title
 *
 * Uses Claude Code to optimize an article title for SEO and click-through rate.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, articleId, currentTitle, targetKeyword } = body;

    if (!domain || !articleId || !currentTitle || !targetKeyword) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, articleId, currentTitle, targetKeyword' },
        { status: 400 }
      );
    }

    // Create a detailed prompt for Claude Code
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

    // Use Gemini API (fast and reliable)
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

      // Update the topical map with the new title
      const websiteDir = DOMAIN_MAPPING[domain] || domain;
      const topicalMapPath = path.join(
        WEBSITES_DIR,
        websiteDir,
        'ai/knowledge/04-content-strategy/ready/topical-map.json'
      );

      const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
      const topicalMap = JSON.parse(jsonContent);

      // Find and update the article
      let articleFound = false;

      for (const pillar of topicalMap.pillars) {
        if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
          continue;
        }

        for (const article of pillar.supportingArticles) {
          // Match by stable ID (pillar.id + article.id)
          const generatedId = `${pillar.id}-${article.id}`;

          if (generatedId === articleId) {
            article.title = cleanedTitle;
            articleFound = true;
            break;
          }
        }

        if (articleFound) break;
      }

      if (!articleFound) {
        return NextResponse.json(
          { error: 'Article not found in topical map' },
          { status: 404 }
        );
      }

      // Write updated topical map back to file
      await fs.writeFile(
        topicalMapPath,
        JSON.stringify(topicalMap, null, 2),
        'utf-8'
      );

      return NextResponse.json({
        success: true,
        optimizedTitle: cleanedTitle,
        message: 'Title optimized successfully'
      });

    } catch (aiError) {
      console.error('AI optimization error:', aiError);
      return NextResponse.json(
        {
          error: 'Failed to optimize title',
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error optimizing article title:', error);
    return NextResponse.json(
      {
        error: 'Failed to optimize article title',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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
