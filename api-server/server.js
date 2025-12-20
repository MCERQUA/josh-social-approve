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
  'insulationcontractorsofarizona.com': 'ICA-Website',
  'foamologyinsulation.com': 'foamologyinsulation-web',
  'humblehelproofing.com': 'humble-help-roofing',
};

// Folder aliases for flexible matching
const FOLDER_ALIASES = {
  'ica': 'ICA-Website',
  'ica-website': 'ICA-Website',
  'foamology': 'foamologyinsulation-web',
  'foamologyinsulation': 'foamologyinsulation-web',
  'cca': 'CCA',
  'contractors-choice': 'CCA',
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
 * Resolve folder name from various inputs (domain, alias, or folder name)
 */
function resolveFolderName(input) {
  // Check domain mapping first
  if (DOMAIN_MAPPING[input]) return DOMAIN_MAPPING[input];

  // Check aliases (case-insensitive)
  const lowerInput = input.toLowerCase();
  if (FOLDER_ALIASES[lowerInput]) return FOLDER_ALIASES[lowerInput];

  // Return as-is
  return input;
}

/**
 * Find the AI knowledge folder (handles both /ai/ and /AI/ cases)
 */
async function findAIKnowledgePath(folderName) {
  const basePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);

  // Try lowercase first (standard)
  const lowercasePath = path.join(basePath, 'ai/knowledge');
  try {
    await fs.access(lowercasePath);
    return lowercasePath;
  } catch {}

  // Try uppercase (ICA-Website uses this)
  const uppercasePath = path.join(basePath, 'AI/knowledge');
  try {
    await fs.access(uppercasePath);
    return uppercasePath;
  } catch {}

  return null;
}

/**
 * GET /api/website-content/:domainFolder
 *
 * Returns topical map and article queue for a website
 */
app.get('/api/website-content/:domainFolder', async (req, res) => {
  try {
    const { domainFolder } = req.params;

    // Resolve folder name through mapping and aliases
    const folderName = resolveFolderName(domainFolder);

    // Find AI knowledge path (handles /ai/ and /AI/)
    const knowledgePath = await findAIKnowledgePath(folderName);

    // Path to topical map
    const topicalMapPath = knowledgePath
      ? path.join(knowledgePath, '04-content-strategy/ready/topical-map.json')
      : path.join(JOSH_AI_WEBSITES_DIR, folderName, 'ai/knowledge/04-content-strategy/ready/topical-map.json');

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
        // Check for AI folder (lowercase or uppercase)
        const aiPathLower = path.join(JOSH_AI_WEBSITES_DIR, entry.name, 'ai');
        const aiPathUpper = path.join(JOSH_AI_WEBSITES_DIR, entry.name, 'AI');

        let hasAI = false;
        let hasTopicalMap = false;

        // Check lowercase first
        try {
          await fs.access(aiPathLower);
          hasAI = true;
          // Check for topical map
          const topicalMapPath = path.join(aiPathLower, 'knowledge/04-content-strategy/ready/topical-map.json');
          try {
            await fs.access(topicalMapPath);
            hasTopicalMap = true;
          } catch {}
        } catch {
          // Try uppercase
          try {
            await fs.access(aiPathUpper);
            hasAI = true;
            // Check for topical map
            const topicalMapPath = path.join(aiPathUpper, 'knowledge/04-content-strategy/ready/topical-map.json');
            try {
              await fs.access(topicalMapPath);
              hasTopicalMap = true;
            } catch {}
          } catch {}
        }

        websites.push({
          folder: entry.name,
          hasAI,
          hasTopicalMap
        });
      }
    }

    // Sort: folders with topical maps first, then by name
    websites.sort((a, b) => {
      if (a.hasTopicalMap && !b.hasTopicalMap) return -1;
      if (!a.hasTopicalMap && b.hasTopicalMap) return 1;
      if (a.hasAI && !b.hasAI) return -1;
      if (!a.hasAI && b.hasAI) return 1;
      return a.folder.localeCompare(b.folder);
    });

    res.json({ websites });
  } catch (error) {
    console.error('Error listing websites:', error);
    res.status(500).json({ error: 'Failed to list websites' });
  }
});

/**
 * POST /api/website-content/:domainFolder/update-title
 *
 * Updates an article title in the topical map
 */
app.post('/api/website-content/:domainFolder/update-title', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { articleId, newTitle } = req.body;

    if (!articleId || !newTitle) {
      return res.status(400).json({ error: 'articleId and newTitle required' });
    }

    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website AI folder not found' });
    }

    const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');

    // Read current topical map
    const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(jsonContent);

    // Find and update the article
    let updated = false;
    for (const pillar of topicalMap.pillars || []) {
      for (const article of pillar.supportingArticles || []) {
        const fullId = `${pillar.id}-${article.id}`;
        if (fullId === articleId || article.id === articleId) {
          article.title = newTitle;
          updated = true;
          break;
        }
      }
      if (updated) break;
    }

    if (!updated) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Write back
    await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));

    res.json({ success: true, message: 'Title updated' });
  } catch (error) {
    console.error('Error updating title:', error);
    res.status(500).json({ error: 'Failed to update title', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/update-status
 *
 * Updates an article status in the topical map
 */
app.post('/api/website-content/:domainFolder/update-status', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { articleId, status } = req.body;

    if (!articleId || !status) {
      return res.status(400).json({ error: 'articleId and status required' });
    }

    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website AI folder not found' });
    }

    const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');

    const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(jsonContent);

    let updated = false;
    for (const pillar of topicalMap.pillars || []) {
      for (const article of pillar.supportingArticles || []) {
        const fullId = `${pillar.id}-${article.id}`;
        if (fullId === articleId || article.id === articleId) {
          article.status = status;
          updated = true;
          break;
        }
      }
      if (updated) break;
    }

    if (!updated) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/randomize-queue
 *
 * Randomizes the queue order for articles
 */
app.post('/api/website-content/:domainFolder/randomize-queue', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website AI folder not found' });
    }

    const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');

    const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
    const topicalMap = JSON.parse(jsonContent);

    // Collect all queued articles
    const queuedArticles = [];
    for (const pillar of topicalMap.pillars || []) {
      for (const article of pillar.supportingArticles || []) {
        if (article.status === 'planned' || article.status === 'researching') {
          queuedArticles.push({ pillar, article });
        }
      }
    }

    // Shuffle using Fisher-Yates
    for (let i = queuedArticles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queuedArticles[i], queuedArticles[j]] = [queuedArticles[j], queuedArticles[i]];
    }

    // Assign new queue orders
    queuedArticles.forEach((item, index) => {
      item.article.queueOrder = index + 1;
    });

    await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));

    res.json({ success: true, message: `Randomized ${queuedArticles.length} articles` });
  } catch (error) {
    console.error('Error randomizing queue:', error);
    res.status(500).json({ error: 'Failed to randomize queue', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/start-research
 *
 * Starts autonomous research for an article using Claude Code
 */
app.post('/api/website-content/:domainFolder/start-research', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { articleId, articleTitle, targetKeyword } = req.body;

    if (!articleId || !articleTitle) {
      return res.status(400).json({ error: 'articleId and articleTitle required' });
    }

    const folderName = resolveFolderName(domainFolder);
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);

    // Create the research prompt
    const slug = slugify(articleTitle);
    const prompt = `Research and write a comprehensive blog article for ${folderName}:

Title: ${articleTitle}
Target Keyword: ${targetKeyword || 'N/A'}
Slug: ${slug}

Follow the 9-phase blog research workflow:
1. Topic Research
2. Keyword Research
3. Authority Link Research
4. FAQ Research
5. Internal Link Research
6. Article Outline Planning
7. Article Design
8. Schema Markup
9. Final Article Generation

Save all research to: ${websitePath}/ai/knowledge/10-Blog-research/${slug}/

Generate a complete, SEO-optimized article with proper HTML formatting.`;

    // Log file for this research
    const logDir = path.join(websitePath, 'ai/blog-research/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `${slug}-${Date.now()}.log`);

    // Spawn Claude Code in detached mode
    const { spawn } = await import('child_process');
    const logFd = await fs.open(logPath, 'w');

    const claude = spawn('claude', [
      'code',
      '--dangerously-skip-permissions',
      '--verbose'
    ], {
      cwd: '/home/josh/Josh-AI',
      stdio: ['pipe', logFd.fd, logFd.fd],
      detached: true
    });

    if (claude.stdin) {
      claude.stdin.write(prompt + '\n');
      claude.stdin.end();
    }

    claude.unref();

    // Update article status to 'researching'
    const knowledgePath = await findAIKnowledgePath(folderName);
    if (knowledgePath) {
      const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');
      try {
        const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
        const topicalMap = JSON.parse(jsonContent);

        for (const pillar of topicalMap.pillars || []) {
          for (const article of pillar.supportingArticles || []) {
            const fullId = `${pillar.id}-${article.id}`;
            if (fullId === articleId || article.id === articleId) {
              article.status = 'researching';
              break;
            }
          }
        }

        await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));
      } catch (err) {
        console.error('Error updating status:', err);
      }
    }

    await logFd.close();

    res.json({
      success: true,
      message: 'Research started',
      pid: claude.pid,
      logPath,
      slug
    });
  } catch (error) {
    console.error('Error starting research:', error);
    res.status(500).json({ error: 'Failed to start research', details: error.message });
  }
});

/**
 * GET /api/website-content/:domainFolder/articles
 *
 * Lists all articles in the blog research folder
 */
app.get('/api/website-content/:domainFolder/articles', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.json({ domain: domainFolder, articles: [], total: 0 });
    }

    const blogResearchPath = path.join(knowledgePath, '10-Blog-research');

    let articles = [];
    try {
      const entries = await fs.readdir(blogResearchPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'QC-REPORTS') {
          const articlePath = path.join(blogResearchPath, entry.name);
          const slug = entry.name;

          // Check what files exist
          const hasHtml = await fileExists(path.join(articlePath, 'article-final.html'));
          const hasDraft = await fileExists(path.join(articlePath, 'article-draft.md'));
          const hasSummary = await fileExists(path.join(articlePath, 'research-summary.md'));

          let status = 'research';
          if (hasHtml) status = 'completed';
          else if (hasDraft) status = 'draft';

          // Default values
          let title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let keyword = '';
          let createdDate = '';
          let wordCount = 0;

          // Read metadata from research-summary.md if exists
          if (hasSummary) {
            try {
              const summaryContent = await fs.readFile(path.join(articlePath, 'research-summary.md'), 'utf-8');
              const titleMatch = summaryContent.match(/\*\*Article Title:\*\*\s+(.+)/);
              const keywordMatch = summaryContent.match(/\*\*Target Keyword:\*\*\s+(.+)/);
              const dateMatch = summaryContent.match(/\*\*Created:\*\*\s+(.+)/);
              if (titleMatch) title = titleMatch[1].trim();
              if (keywordMatch) keyword = keywordMatch[1].trim();
              if (dateMatch) createdDate = dateMatch[1].trim();
            } catch (err) {
              // Continue with defaults
            }
          }

          // Get word count from draft
          if (hasDraft) {
            try {
              const draftContent = await fs.readFile(path.join(articlePath, 'article-draft.md'), 'utf-8');
              wordCount = draftContent.split(/\s+/).length;
            } catch (err) {
              // Continue
            }
          }

          // Get directory stats
          const stats = await fs.stat(articlePath);

          // Count research files
          const researchFileCount = await countResearchFiles(articlePath);

          articles.push({
            slug,
            title,
            keyword,
            createdDate: createdDate || stats.ctime.toISOString().split('T')[0],
            wordCount,
            hasHtml,
            hasDraft,
            status,
            researchFileCount,
            lastModified: stats.mtime.toISOString()
          });
        }
      }
    } catch (err) {
      // No blog research folder yet
    }

    // Sort by most recent first
    articles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    res.json({ domain: domainFolder, articles, total: articles.length });
  } catch (error) {
    console.error('Error listing articles:', error);
    res.status(500).json({ error: 'Failed to list articles', details: error.message });
  }
});

/**
 * GET /api/website-content/:domainFolder/articles/:slug
 *
 * Gets full article details including content and research files
 */
app.get('/api/website-content/:domainFolder/articles/:slug', async (req, res) => {
  try {
    const { domainFolder, slug } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const articlePath = path.join(knowledgePath, '10-Blog-research', slug);

    try {
      await fs.access(articlePath);
    } catch {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Read available files
    const htmlContent = await readFileOrNull(path.join(articlePath, 'article-final.html'));
    const draftContent = await readFileOrNull(path.join(articlePath, 'article-draft.md'));
    const summaryContent = await readFileOrNull(path.join(articlePath, 'research-summary.md'));

    // Read research files
    const researchFiles = {};
    const researchCategories = [
      { key: 'topic', dir: 'topic-research' },
      { key: 'keyword', dir: 'keyword-research' },
      { key: 'authority', dir: 'authority-link-research' },
      { key: 'faq', dir: 'faq-research' },
      { key: 'internal', dir: 'internal-link-research' },
      { key: 'outline', dir: 'article-outline-planner' },
      { key: 'design', dir: 'article-design' },
      { key: 'schema', dir: 'schema-markup' }
    ];

    for (const category of researchCategories) {
      const categoryPath = path.join(articlePath, category.dir);
      try {
        const files = await fs.readdir(categoryPath);
        const fileContents = [];

        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.json')) {
            const filePath = path.join(categoryPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);

            fileContents.push({
              filename: file,
              content,
              size: stats.size,
              modified: stats.mtime.toISOString()
            });
          }
        }

        researchFiles[category.key] = fileContents;
      } catch {
        researchFiles[category.key] = [];
      }
    }

    // Parse metadata from summary
    let metadata = {
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      keyword: '',
      createdDate: '',
      wordCount: 0,
      targetWordCount: '3500-5000'
    };

    if (summaryContent) {
      const titleMatch = summaryContent.match(/\*\*Article Title:\*\*\s+(.+)/);
      const keywordMatch = summaryContent.match(/\*\*Target Keyword:\*\*\s+(.+)/);
      const dateMatch = summaryContent.match(/\*\*Created:\*\*\s+(.+)/);
      const targetWordCountMatch = summaryContent.match(/\*\*Target Word Count:\*\*\s+(.+)/);

      if (titleMatch) metadata.title = titleMatch[1].trim();
      if (keywordMatch) metadata.keyword = keywordMatch[1].trim();
      if (dateMatch) metadata.createdDate = dateMatch[1].trim();
      if (targetWordCountMatch) metadata.targetWordCount = targetWordCountMatch[1].trim();
    }

    // Calculate word count from draft or HTML
    if (draftContent) {
      metadata.wordCount = draftContent.split(/\s+/).length;
    } else if (htmlContent) {
      const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
      metadata.wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    }

    res.json({
      slug,
      metadata,
      htmlContent,
      draftContent,
      summaryContent,
      researchFiles,
      hasHtml: !!htmlContent,
      hasDraft: !!draftContent,
      status: htmlContent ? 'completed' : draftContent ? 'draft' : 'research'
    });
  } catch (error) {
    console.error('Error getting article:', error);
    res.status(500).json({ error: 'Failed to get article', details: error.message });
  }
});

// Helper to check file existence
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper to count research files in subdirectories
async function countResearchFiles(articlePath) {
  try {
    const subdirs = [
      'topic-research',
      'keyword-research',
      'authority-link-research',
      'faq-research',
      'internal-link-research'
    ];

    let count = 0;
    for (const subdir of subdirs) {
      const dirPath = path.join(articlePath, subdir);
      try {
        const files = await fs.readdir(dirPath);
        count += files.filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return count;
  } catch {
    return 0;
  }
}

// Helper to read file or return null
async function readFileOrNull(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

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

/**
 * POST /api/website-content/:domainFolder/resume-research
 *
 * Resumes article research from where it left off
 */
app.post('/api/website-content/:domainFolder/resume-research', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'slug required' });
    }

    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const articlePath = path.join(knowledgePath, '10-Blog-research', slug);

    try {
      await fs.access(articlePath);
    } catch {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check what phases are completed
    const phaseStatus = await checkPhaseStatus(articlePath);

    if (phaseStatus.nextPhase >= 10) {
      return res.json({
        success: true,
        message: 'Article already complete',
        completedPhases: phaseStatus.completed,
        nextPhase: null
      });
    }

    // Build resume prompt
    const resumePrompt = buildResumePrompt(folderName, slug, articlePath, phaseStatus);

    // Log file for this research
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);
    const logDir = path.join(websitePath, 'ai/blog-research/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `${slug}-resume-${Date.now()}.log`);

    // Spawn Claude Code in detached mode
    const { spawn } = await import('child_process');
    const logFd = await fs.open(logPath, 'w');

    const claude = spawn('claude', [
      'code',
      '--dangerously-skip-permissions',
      '--verbose'
    ], {
      cwd: '/home/josh/Josh-AI',
      stdio: ['pipe', logFd.fd, logFd.fd],
      detached: true
    });

    if (claude.stdin) {
      claude.stdin.write(resumePrompt + '\n');
      claude.stdin.end();
    }

    claude.unref();
    await logFd.close();

    res.json({
      success: true,
      message: `Research resumed from Phase ${phaseStatus.nextPhase}`,
      pid: claude.pid,
      logPath,
      resumedFrom: phaseStatus.nextPhase,
      completedPhases: phaseStatus.completed
    });
  } catch (error) {
    console.error('Error resuming research:', error);
    res.status(500).json({ error: 'Failed to resume research', details: error.message });
  }
});

/**
 * GET /api/website-content/:domainFolder/qc
 *
 * Scans article research folders and returns completeness report
 */
app.get('/api/website-content/:domainFolder/qc', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const researchPath = path.join(knowledgePath, '10-Blog-research');

    let articleDirs = [];
    try {
      const entries = await fs.readdir(researchPath, { withFileTypes: true });
      articleDirs = entries.filter(e =>
        e.isDirectory() &&
        !e.name.startsWith('.') &&
        e.name !== 'QC-REPORTS'
      );
    } catch {
      return res.json({
        domain: domainFolder,
        timestamp: new Date().toISOString(),
        totalArticles: 0,
        complete: 0,
        needsSchema: 0,
        needsHtml: 0,
        needsDraft: 0,
        needsResearch: 0,
        articles: [],
        recommendations: ['No research directory found. Start researching some articles!']
      });
    }

    const articles = [];

    for (const dir of articleDirs) {
      const articlePath = path.join(researchPath, dir.name);

      // Check critical files
      const hasDraft = await fileExists(path.join(articlePath, 'article-draft.md'));
      const hasHtml = await fileExists(path.join(articlePath, 'article-final.html'));
      const hasSchema = await fileExists(path.join(articlePath, 'schema.json'));

      // Check research folders
      const researchFolders = ['topic-research', 'keyword-research', 'authority-link-research', 'faq-research'];
      let researchCount = 0;

      for (const folder of researchFolders) {
        const folderPath = path.join(articlePath, folder);
        if (await directoryHasContent(folderPath)) {
          researchCount++;
        }
      }

      const hasResearch = researchCount >= 3;

      // Determine completion level
      const missingComponents = [];
      let completionLevel;

      if (hasDraft && hasHtml && hasSchema) {
        completionLevel = 'complete';
      } else if (hasDraft && hasHtml && !hasSchema) {
        completionLevel = 'needs-schema';
        missingComponents.push('schema.json');
      } else if (hasDraft && !hasHtml) {
        completionLevel = 'needs-html';
        missingComponents.push('article-final.html');
        if (!hasSchema) missingComponents.push('schema.json');
      } else if (hasResearch && !hasDraft) {
        completionLevel = 'needs-draft';
        missingComponents.push('article-draft.md', 'article-final.html', 'schema.json');
      } else {
        completionLevel = 'needs-research';
        missingComponents.push('research folders', 'article-draft.md', 'article-final.html', 'schema.json');
      }

      articles.push({
        slug: dir.name,
        hasResearch,
        hasDraft,
        hasHtml,
        hasSchema,
        completionLevel,
        researchFolders: researchCount,
        missingComponents
      });
    }

    // Calculate summary stats
    const complete = articles.filter(a => a.completionLevel === 'complete').length;
    const needsSchema = articles.filter(a => a.completionLevel === 'needs-schema').length;
    const needsHtml = articles.filter(a => a.completionLevel === 'needs-html').length;
    const needsDraft = articles.filter(a => a.completionLevel === 'needs-draft').length;
    const needsResearch = articles.filter(a => a.completionLevel === 'needs-research').length;

    // Generate recommendations
    const recommendations = [];
    if (needsSchema > 0) recommendations.push(`${needsSchema} article(s) need schema markup`);
    if (needsHtml > 0) recommendations.push(`${needsHtml} article(s) need HTML conversion`);
    if (needsDraft > 0) recommendations.push(`${needsDraft} article(s) need draft writing`);
    if (needsResearch > 0) recommendations.push(`${needsResearch} article(s) need research`);
    if (complete === articles.length && articles.length > 0) {
      recommendations.push('All articles are complete!');
    }

    res.json({
      domain: domainFolder,
      timestamp: new Date().toISOString(),
      totalArticles: articles.length,
      complete,
      needsSchema,
      needsHtml,
      needsDraft,
      needsResearch,
      articles: articles.sort((a, b) => {
        const order = { 'complete': 0, 'needs-schema': 1, 'needs-html': 2, 'needs-draft': 3, 'needs-research': 4 };
        return order[a.completionLevel] - order[b.completionLevel];
      }),
      recommendations
    });
  } catch (error) {
    console.error('Error in QC scan:', error);
    res.status(500).json({ error: 'Failed to scan articles', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/optimize-title
 *
 * Optimizes an article title using Gemini API
 */
app.post('/api/website-content/:domainFolder/optimize-title', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { articleId, currentTitle, targetKeyword } = req.body;

    if (!articleId || !currentTitle || !targetKeyword) {
      return res.status(400).json({ error: 'articleId, currentTitle, and targetKeyword required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const prompt = `You are an expert SEO copywriter. Optimize this article title:

CURRENT TITLE: "${currentTitle}"
TARGET KEYWORD: "${targetKeyword}"

REQUIREMENTS:
1. Must include the target keyword "${targetKeyword}"
2. Make it compelling and enticing to click
3. Keep it under 60 characters
4. Maintain professionalism for insurance/contractor industry

Provide ONLY the optimized title (no explanation, no quotes).`;

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

    let optimizedTitle = data.candidates[0].content.parts[0].text.trim()
      .replace(/^(OPTIMIZED TITLE:|Here (?:is|'s) the optimized title:?|Title:)\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    // Ensure keyword is included
    if (!optimizedTitle.toLowerCase().includes(targetKeyword.toLowerCase())) {
      optimizedTitle = `${targetKeyword}: ${optimizedTitle}`;
    }

    // Update the topical map
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (knowledgePath) {
      const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');
      try {
        const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
        const topicalMap = JSON.parse(jsonContent);

        let updated = false;
        for (const pillar of topicalMap.pillars || []) {
          for (const article of pillar.supportingArticles || []) {
            const fullId = `${pillar.id}-${article.id}`;
            if (fullId === articleId || article.id === articleId) {
              article.title = optimizedTitle;
              updated = true;
              break;
            }
          }
          if (updated) break;
        }

        if (updated) {
          await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));
        }
      } catch (err) {
        console.error('Error updating topical map:', err);
      }
    }

    res.json({
      success: true,
      optimizedTitle,
      message: 'Title optimized successfully'
    });
  } catch (error) {
    console.error('Error optimizing title:', error);
    res.status(500).json({ error: 'Failed to optimize title', details: error.message });
  }
});

// Helper: Check directory has content
async function directoryHasContent(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.length > 0;
  } catch {
    return false;
  }
}

// Helper: Check phase status for resume
async function checkPhaseStatus(articlePath) {
  const completed = [];
  let nextPhase = 2;

  // Phase 1: Setup (always completed if directory exists)
  completed.push(1);

  // Phase 2: Research
  const hasKeywordResearch = await fileExists(path.join(articlePath, 'keyword-research/keyword-report.md'));
  const hasAuthorityLinks = await fileExists(path.join(articlePath, 'authority-link-research/authority-sources.md'));
  const hasFaqResearch = await fileExists(path.join(articlePath, 'faq-research/faq-report.md'));
  const hasTopicResearch = await fileExists(path.join(articlePath, 'topic-research/topic-research-report.md'));

  if (hasKeywordResearch && hasAuthorityLinks && hasFaqResearch && hasTopicResearch) {
    completed.push(2);
    nextPhase = 3;
  }

  // Phase 3-5
  if (await fileExists(path.join(articlePath, 'research-quality-approved.json'))) {
    completed.push(3);
    nextPhase = 4;
  }
  if (await fileExists(path.join(articlePath, 'article-plan.md'))) {
    completed.push(4);
    nextPhase = 5;
  }
  if (await fileExists(path.join(articlePath, 'article-draft.md'))) {
    completed.push(5);
    nextPhase = 6;
  }
  if (await fileExists(path.join(articlePath, 'internal-links.json'))) {
    completed.push(6);
    nextPhase = 7;
  }
  if (await fileExists(path.join(articlePath, 'article-final.html'))) {
    completed.push(7);
    nextPhase = 8;
  }
  if (await fileExists(path.join(articlePath, 'final-review-approved.json'))) {
    completed.push(8);
    nextPhase = 9;
  }
  if (await fileExists(path.join(articlePath, 'schema.json'))) {
    completed.push(9);
    nextPhase = 10;
  }

  return { completed, nextPhase };
}

// Helper: Build resume prompt
function buildResumePrompt(domain, slug, articlePath, phaseStatus) {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  let prompt = `# Resume Article Research - ${title}

**Article Directory:** ${articlePath}
**Website:** ${domain}
**Slug:** ${slug}
**Current Status:** Resuming from Phase ${phaseStatus.nextPhase}

## Completed Phases
${phaseStatus.completed.map(p => `✅ Phase ${p}`).join('\n')}

## Your Mission
Complete the remaining phases of the article research workflow. DO NOT redo completed phases.
Start with Phase ${phaseStatus.nextPhase} and continue through Phase 9.

## Phase Descriptions
- Phase 3: Quality Review (create research-quality-approved.json)
- Phase 4: Article Outline (create article-plan.md)
- Phase 5: Write Draft (create article-draft.md, 3500-5000 words)
- Phase 6: Enhancement (create internal-links.json)
- Phase 7: HTML Creation (create article-final.html)
- Phase 8: Final Review (create final-review-approved.json)
- Phase 9: Schema Markup (create schema.json)

Work autonomously until Phase 9 is complete.`;

  return prompt;
}

// Start server
app.listen(PORT, () => {
  console.log(`JAM Social API server running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: *.jamsocial.app, localhost`);
});
