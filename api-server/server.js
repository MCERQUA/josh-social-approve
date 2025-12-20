/**
 * JAM Social API Server
 *
 * VPS-based API server that provides filesystem-based website management
 * features to the Netlify-hosted customer dashboard.
 *
 * Runs on: http://localhost:6350
 * Called by: https://*.jamsocial.app (Netlify frontend)
 */

import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 6350;

// Josh-AI websites directory
const JOSH_AI_WEBSITES_DIR = '/home/josh/Josh-AI/websites';

// Domain to folder mapping (matches Josh-AI system)
const DOMAIN_MAPPING = {
  'contractorschoiceagency.com': 'CCA',
  'insulationcontractorsofarizona.com': 'foamologyinsulation-web',
  'foamologyinsulation.com': 'foamologyinsulation-web',
  'humblehelproofing.com': 'humble-help-roofing',
};

// CORS configuration - allow all jamsocial.app subdomains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from jamsocial.app subdomains and localhost for dev
    if (!origin ||
        origin.endsWith('.jamsocial.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'jam-social-api', timestamp: new Date().toISOString() });
});

/**
 * GET /api/website-content/:domainFolder
 *
 * Returns topical map and article queue for a website
 */
app.get('/api/website-content/:domainFolder', async (req, res) => {
  try {
    const { domainFolder } = req.params;

    // Resolve folder name through mapping
    const folderName = DOMAIN_MAPPING[domainFolder] || domainFolder;

    // Path to topical map
    const topicalMapPath = path.join(
      JOSH_AI_WEBSITES_DIR,
      folderName,
      'ai/knowledge/04-content-strategy/ready/topical-map.json'
    );

    let topicalMap = null;
    let articleQueue = [];
    let stats = {
      total_pillars: 0,
      total_articles: 0,
      planned: 0,
      researching: 0,
      published: 0,
      in_queue: 0
    };

    try {
      await fs.access(topicalMapPath);
      const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
      topicalMap = JSON.parse(jsonContent);

      // Build article queue from topical map
      if (topicalMap.pillars && Array.isArray(topicalMap.pillars)) {
        let orderCounter = 1;
        stats.total_pillars = topicalMap.pillars.length;

        for (const pillar of topicalMap.pillars) {
          if (!pillar.supportingArticles || !Array.isArray(pillar.supportingArticles)) {
            continue;
          }

          stats.total_articles += pillar.supportingArticles.length;

          for (const article of pillar.supportingArticles) {
            // Count by status
            if (article.status === 'planned') stats.planned++;
            else if (article.status === 'researching') stats.researching++;
            else if (article.status === 'published') stats.published++;

            // Only add queued articles
            if (article.status === 'planned' || article.status === 'researching') {
              const priority = normalizePriority(pillar.priority);
              articleQueue.push({
                id: `${pillar.id}-${article.id}`,
                title: article.title || article.id,
                slug: slugify(article.url || article.title || article.id),
                target_keyword: article.keyword || pillar.primaryKeyword || '',
                cluster: pillar.title,
                cluster_priority: priority,
                status: article.status || 'planned',
                order: article.queueOrder || orderCounter++,
                estimated_hours: article.estimatedWordCount
                  ? Math.ceil(article.estimatedWordCount / 500)
                  : 3.5
              });
            }
          }
        }

        // Sort by order
        articleQueue.sort((a, b) => a.order - b.order);
        stats.in_queue = articleQueue.length;
      }
    } catch (err) {
      // No topical map found - that's okay
      console.log(`No topical map found for ${folderName}`);
    }

    res.json({
      domainFolder: folderName,
      topicalMap: topicalMap ? {
        metadata: topicalMap._metadata || {},
        pillars: topicalMap.pillars || []
      } : null,
      articleQueue,
      stats,
      hasContent: topicalMap !== null
    });

  } catch (error) {
    console.error('Error fetching website content:', error);
    res.status(500).json({
      error: 'Failed to fetch website content',
      details: error.message
    });
  }
});

/**
 * GET /api/websites/available
 *
 * Returns list of available websites in Josh-AI system
 */
app.get('/api/websites/available', async (req, res) => {
  try {
    const entries = await fs.readdir(JOSH_AI_WEBSITES_DIR, { withFileTypes: true });

    const websites = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('JOSH-')) {
        // Check if it has ai/knowledge folder
        const aiPath = path.join(JOSH_AI_WEBSITES_DIR, entry.name, 'ai');
        try {
          await fs.access(aiPath);
          websites.push({
            folder: entry.name,
            hasAI: true
          });
        } catch {
          websites.push({
            folder: entry.name,
            hasAI: false
          });
        }
      }
    }

    res.json({ websites });
  } catch (error) {
    console.error('Error listing websites:', error);
    res.status(500).json({ error: 'Failed to list websites' });
  }
});

/**
 * Proxy to Josh-AI API (localhost:6345)
 */
app.get('/api/proxy/josh-ai/*', async (req, res) => {
  try {
    const path = req.params[0];
    const queryString = new URLSearchParams(req.query).toString();
    const url = `http://localhost:6345/api/${path}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Error proxying to Josh-AI:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
});

// Helper functions
function normalizePriority(priority) {
  if (!priority) return 'medium';
  const p = priority.toLowerCase();
  if (p.includes('critical') || p.includes('highest') || p === 'high') return 'high';
  if (p.includes('low')) return 'low';
  return 'medium';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\//g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Start server
app.listen(PORT, () => {
  console.log(`JAM Social API server running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: *.jamsocial.app, localhost`);
});
