import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to directory mapping
const DOMAIN_MAPPING: Record<string, string> = {
  'contractorschoiceagency.com': 'CCA'
};

/**
 * POST /api/websites/topical-map/generate
 *
 * Generates ONLY the topical map from already-processed knowledge.
 * This is faster than full knowledge processing.
 *
 * Reads from:
 * - 03-keyword-research/ready/ (keyword clusters, search intent)
 * - 04-content-strategy/ready/ (content gaps, content calendar)
 * - 11-autonomous-research/topic-clusters/ (cluster structure)
 *
 * Creates:
 * - 04-content-strategy/ready/topical-map.json
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
    }

    const websiteDir = DOMAIN_MAPPING[domain] || domain;
    const knowledgeBase = path.join(WEBSITES_DIR, websiteDir, 'ai/knowledge');

    // Check if autonomous research exists
    const researchDir = path.join(knowledgeBase, '11-autonomous-research/topic-clusters');
    try {
      await fs.access(researchDir);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Topic cluster research not found',
        message: 'Run autonomous research first to generate topic clusters',
        hint: `Missing: ${researchDir}`,
        showToast: true,
        toastType: 'error'
      }, { status: 404 });
    }

    // Read topic cluster files from autonomous research
    const clusterFiles = await fs.readdir(researchDir);
    const clusterData: any[] = [];

    for (const file of clusterFiles) {
      if (!file.endsWith('.md') || file === 'README.md') continue;

      const filePath = path.join(researchDir, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse cluster information from markdown
      const clusterMatch = content.match(/# (.+)/);
      const descriptionMatch = content.match(/## Description\s+([\s\S]+?)(?=\n##|\n$)/);

      // Extract pillar page and supporting articles
      const pillarMatch = content.match(/\*\*Pillar Page:\*\*\s+(.+)/);
      const keywordMatch = content.match(/\*\*Primary Keyword:\*\*\s+(.+)/);

      // Extract supporting articles (look for bullet lists)
      const supportingArticles: any[] = [];
      const articleMatches = content.matchAll(/[-*]\s+\*\*(.+?)\*\*[:\s]+(.+?)(?:\n|$)/g);

      for (const match of articleMatches) {
        supportingArticles.push({
          title: match[1].trim(),
          keyword: match[2].trim().replace(/[()]/g, ''),
          status: 'planned' as const
        });
      }

      if (clusterMatch) {
        clusterData.push({
          id: file.replace('.md', ''),
          title: clusterMatch[1].trim(),
          pillarPage: pillarMatch ? pillarMatch[1].trim() : '',
          primaryKeyword: keywordMatch ? keywordMatch[1].trim() : '',
          priority: file.includes('01-coverage') || file.includes('02-framing') ? 'high' as const :
                   file.includes('08-company') ? 'low' as const : 'medium' as const,
          status: 'planned' as const,
          supportingArticles
        });
      }
    }

    // Generate topical map structure
    const topicalMap = {
      _metadata: {
        domain,
        generated: new Date().toISOString(),
        source: 'topic-clusters autonomous research',
        totalClusters: clusterData.length,
        totalArticles: clusterData.reduce((sum, c) => sum + c.supportingArticles.length, 0)
      },
      pillars: clusterData
    };

    // Write topical map JSON
    const outputPath = path.join(knowledgeBase, '04-content-strategy/ready/topical-map.json');

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await fs.writeFile(outputPath, JSON.stringify(topicalMap, null, 2), 'utf-8');

    console.log(`[TOPICAL-MAP] Generated topical map for ${domain}`);
    console.log(`[TOPICAL-MAP] Pillars: ${clusterData.length}, Articles: ${topicalMap._metadata.totalArticles}`);
    console.log(`[TOPICAL-MAP] Output: ${outputPath}`);

    return NextResponse.json({
      success: true,
      domain,
      message: `Topical map generated with ${clusterData.length} pillars and ${topicalMap._metadata.totalArticles} articles`,
      pillars: clusterData.length,
      articles: topicalMap._metadata.totalArticles,
      outputFile: '04-content-strategy/ready/topical-map.json',
      showToast: true,
      toastType: 'success',
      toastMessage: `✅ Generated ${clusterData.length} pillars with ${topicalMap._metadata.totalArticles} supporting articles`
    });

  } catch (error: any) {
    console.error('[TOPICAL-MAP] Error generating topical map:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate topical map',
      details: error.message,
      showToast: true,
      toastType: 'error',
      toastMessage: '❌ Failed to generate topical map'
    }, { status: 500 });
  }
}
