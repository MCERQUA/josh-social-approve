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
import multer from 'multer';
import sharp from 'sharp';

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
 * GET /api/website-content/:domainFolder/sessions
 *
 * Lists all active research sessions for a domain
 */
app.get('/api/website-content/:domainFolder/sessions', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.json({ sessions: [] });
    }

    const blogResearchPath = path.join(knowledgePath, '10-Blog-research');
    const sessions = [];

    try {
      const entries = await fs.readdir(blogResearchPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const sessionPath = path.join(blogResearchPath, entry.name, 'session.json');
          try {
            const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));

            // Check if process is still running
            const isRunning = await isProcessRunning(sessionData.pid);

            sessions.push({
              ...sessionData,
              slug: entry.name,
              isRunning
            });
          } catch {
            // No session file for this article
          }
        }
      }
    } catch {
      // No blog research directory
    }

    res.json({ sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions', details: error.message });
  }
});

/**
 * GET /api/website-content/:domainFolder/session/:slug
 *
 * Gets session status for a specific article
 */
app.get('/api/website-content/:domainFolder/session/:slug', async (req, res) => {
  try {
    const { domainFolder, slug } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const sessionPath = path.join(knowledgePath, '10-Blog-research', slug, 'session.json');

    try {
      const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
      const isRunning = await isProcessRunning(sessionData.pid);

      // If process died but status is still 'running', mark as failed
      if (!isRunning && sessionData.status === 'running') {
        sessionData.status = 'interrupted';
        sessionData.endTime = new Date().toISOString();
        await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
      }

      res.json({ ...sessionData, isRunning });
    } catch {
      res.json({ exists: false, message: 'No active session for this article' });
    }
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/start-research
 *
 * Starts autonomous research for an article using Claude Code with session tracking
 */
app.post('/api/website-content/:domainFolder/start-research', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { articleId, articleTitle, targetKeyword, forceNew = false } = req.body;

    if (!articleId || !articleTitle) {
      return res.status(400).json({ error: 'articleId and articleTitle required' });
    }

    const folderName = resolveFolderName(domainFolder);
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);
    const knowledgePath = await findAIKnowledgePath(folderName);
    const slug = slugify(articleTitle);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website AI folder not found' });
    }

    const articlePath = path.join(knowledgePath, '10-Blog-research', slug);
    const sessionPath = path.join(articlePath, 'session.json');

    // Check for existing active session
    if (!forceNew) {
      try {
        const existingSession = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
        const isRunning = await isProcessRunning(existingSession.pid);

        if (isRunning) {
          return res.status(409).json({
            error: 'Research already in progress',
            message: `Article "${articleTitle}" already has an active research session`,
            session: existingSession,
            hint: 'Use forceNew: true to start a new session anyway'
          });
        }
      } catch {
        // No existing session, continue
      }
    }

    // Create article directory
    await fs.mkdir(articlePath, { recursive: true });

    // Generate unique session ID
    const sessionId = `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create the research prompt
    const prompt = `# Autonomous Blog Article Research - Session ${sessionId}

**Website:** ${folderName}
**Article Title:** ${articleTitle}
**Target Keyword:** ${targetKeyword || 'N/A'}
**Slug:** ${slug}
**Session ID:** ${sessionId}

## Your Mission
Complete the full 9-phase blog research workflow for this article autonomously.

**Working Directory:** ${articlePath}/

## Phases to Complete
1. **Setup** - Create directory structure and research-summary.md
2. **Topic Research** - Save to topic-research/
3. **Keyword Research** - Save to keyword-research/
4. **Authority Link Research** - Save to authority-link-research/
5. **FAQ Research** - Save to faq-research/
6. **Quality Review** - Create research-quality-approved.json
7. **Article Outline** - Create article-plan.md
8. **Write Draft** - Create article-draft.md (3500-5000 words)
9. **HTML Creation** - Create article-final.html
10. **Schema Markup** - Create schema.json

## IMPORTANT
- Work autonomously until ALL phases are complete
- Update research-summary.md with progress
- When finished, the article-final.html and schema.json must exist

Begin now.`;

    // Log file for this research
    const logDir = path.join(websitePath, 'ai/blog-research/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `${sessionId}.log`);

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

    const pid = claude.pid;

    // Save session info
    const sessionData = {
      sessionId,
      articleId,
      articleTitle,
      targetKeyword: targetKeyword || '',
      slug,
      pid,
      status: 'running',
      startTime: new Date().toISOString(),
      logPath,
      domain: domainFolder
    };

    await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));

    if (claude.stdin) {
      claude.stdin.write(prompt + '\n');
      claude.stdin.end();
    }

    claude.unref();
    await logFd.close();

    // Update article status to 'researching' in topical map
    const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');
    try {
      const jsonContent = await fs.readFile(topicalMapPath, 'utf-8');
      const topicalMap = JSON.parse(jsonContent);

      for (const pillar of topicalMap.pillars || []) {
        for (const article of pillar.supportingArticles || []) {
          const fullId = `${pillar.id}-${article.id}`;
          if (fullId === articleId || article.id === articleId) {
            article.status = 'researching';
            article.sessionId = sessionId;
            break;
          }
        }
      }

      await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));
    } catch (err) {
      console.error('Error updating topical map status:', err);
    }

    res.json({
      success: true,
      message: 'Research started with session tracking',
      session: sessionData
    });
  } catch (error) {
    console.error('Error starting research:', error);
    res.status(500).json({ error: 'Failed to start research', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/resume-session/:slug
 *
 * Resumes an interrupted research session
 */
app.post('/api/website-content/:domainFolder/resume-session/:slug', async (req, res) => {
  try {
    const { domainFolder, slug } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const articlePath = path.join(knowledgePath, '10-Blog-research', slug);
    const sessionPath = path.join(articlePath, 'session.json');

    // Check for existing session
    let existingSession;
    try {
      existingSession = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
    } catch {
      return res.status(404).json({ error: 'No session found for this article' });
    }

    // Check if already running
    const isRunning = await isProcessRunning(existingSession.pid);
    if (isRunning) {
      return res.status(409).json({
        error: 'Session already running',
        session: existingSession
      });
    }

    // Check what phases are completed
    const phaseStatus = await checkPhaseStatus(articlePath);

    if (phaseStatus.nextPhase >= 10) {
      // Update session as completed
      existingSession.status = 'completed';
      existingSession.endTime = new Date().toISOString();
      await fs.writeFile(sessionPath, JSON.stringify(existingSession, null, 2));

      return res.json({
        success: true,
        message: 'Article research already complete',
        session: existingSession,
        completedPhases: phaseStatus.completed
      });
    }

    // Generate new session ID for resume
    const newSessionId = `${slug}-resume-${Date.now()}`;
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);

    // Build resume prompt
    const resumePrompt = `# Resume Article Research - Session ${newSessionId}

**Resuming from:** ${existingSession.sessionId}
**Article:** ${existingSession.articleTitle}
**Working Directory:** ${articlePath}/
**Current Status:** Resuming from Phase ${phaseStatus.nextPhase}

## Completed Phases
${phaseStatus.completed.map(p => `✅ Phase ${p}`).join('\n')}

## Your Mission
Complete the remaining phases. DO NOT redo completed phases.
Start with Phase ${phaseStatus.nextPhase} and continue through Phase 10.

## Remaining Phases
${phaseStatus.nextPhase <= 2 ? '- Phase 2: Research (topic, keyword, authority, FAQ)' : ''}
${phaseStatus.nextPhase <= 3 ? '- Phase 3: Quality Review (research-quality-approved.json)' : ''}
${phaseStatus.nextPhase <= 4 ? '- Phase 4: Article Outline (article-plan.md)' : ''}
${phaseStatus.nextPhase <= 5 ? '- Phase 5: Write Draft (article-draft.md, 3500-5000 words)' : ''}
${phaseStatus.nextPhase <= 6 ? '- Phase 6: Enhancement (internal-links.json)' : ''}
${phaseStatus.nextPhase <= 7 ? '- Phase 7: HTML Creation (article-final.html)' : ''}
${phaseStatus.nextPhase <= 8 ? '- Phase 8: Final Review (final-review-approved.json)' : ''}
${phaseStatus.nextPhase <= 9 ? '- Phase 9: Schema Markup (schema.json)' : ''}

Work autonomously until all phases are complete.`;

    // Log file
    const logDir = path.join(websitePath, 'ai/blog-research/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `${newSessionId}.log`);

    // Spawn Claude Code
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

    // Update session
    const updatedSession = {
      ...existingSession,
      sessionId: newSessionId,
      pid: claude.pid,
      status: 'running',
      resumedAt: new Date().toISOString(),
      resumedFrom: existingSession.sessionId,
      resumeCount: (existingSession.resumeCount || 0) + 1,
      logPath
    };

    await fs.writeFile(sessionPath, JSON.stringify(updatedSession, null, 2));

    if (claude.stdin) {
      claude.stdin.write(resumePrompt + '\n');
      claude.stdin.end();
    }

    claude.unref();
    await logFd.close();

    res.json({
      success: true,
      message: `Research resumed from Phase ${phaseStatus.nextPhase}`,
      session: updatedSession,
      completedPhases: phaseStatus.completed,
      nextPhase: phaseStatus.nextPhase
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    res.status(500).json({ error: 'Failed to resume session', details: error.message });
  }
});

// Helper: Check if a process is running
async function isProcessRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

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
      // Check for schema in both locations (root or schema-markup folder)
      const hasSchema = await fileExists(path.join(articlePath, 'schema.json')) ||
                        await fileExists(path.join(articlePath, 'schema-markup/schema.json'));

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

    const prompt = `You are a content writer creating article headlines for a home improvement company.

CURRENT TITLE: "${currentTitle}"
KEYWORD TO INCLUDE: "${targetKeyword}"

RULE #1: NEVER use a colon. No "Keyword: Something" format.
RULE #2: Mix positive AND practical angles, not just fear/problems.

Write ONE headline that includes "${targetKeyword}" naturally. Under 60 characters.

PICK FROM THESE STYLES (vary them, don't always use the same one):

POSITIVE/BENEFITS:
- "How ${targetKeyword} Can Cut Your Energy Bills in Half"
- "The Simple ${targetKeyword} Upgrade That Pays for Itself"
- "Why Homeowners Love ${targetKeyword} (Real Results)"

PRACTICAL/HELPFUL:
- "Everything You Need to Know About ${targetKeyword}"
- "How Much Does ${targetKeyword} Actually Cost in 2025?"
- "A Homeowner's Guide to Choosing the Right ${targetKeyword}"

CURIOSITY:
- "What Most People Don't Know About ${targetKeyword}"
- "The ${targetKeyword} Secret Contractors Won't Tell You"

QUESTION:
- "Is ${targetKeyword} Worth It? Here's the Honest Answer"
- "Should You Get ${targetKeyword}? A Simple Decision Guide"

COMPARISON:
- "${targetKeyword} vs Fiberglass — Which Is Actually Better?"
- "We Tested 3 Types of ${targetKeyword}. Here's What Won."

LOCAL (if keyword includes a city/state, use it):
- "${targetKeyword} for Your Area (What Works Best)"
- "Why Local Climate Makes ${targetKeyword} Essential"

BAD (never do these):
- "Attic Insulation: Benefits" ❌
- "Spray Foam: Complete Guide" ❌
- Anything with a colon ❌

Return ONLY the headline. No quotes.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 100
          }
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
      .replace(/^\d+\.\s*/, '')
      .trim();

    // FORCE remove colon patterns - if Gemini still uses "Keyword: Something", fix it
    if (optimizedTitle.includes(':')) {
      const colonIndex = optimizedTitle.indexOf(':');
      const beforeColon = optimizedTitle.slice(0, colonIndex).trim();
      const afterColon = optimizedTitle.slice(colonIndex + 1).trim();

      // If it looks like "Keyword: Subtitle" pattern, restructure it
      if (beforeColon.toLowerCase().includes(targetKeyword.toLowerCase().split(' ')[0])) {
        // The keyword is before the colon - bad pattern, rewrite
        optimizedTitle = `${afterColon} for ${beforeColon}`;
      } else {
        // Just remove the colon, join with dash
        optimizedTitle = `${beforeColon} — ${afterColon}`;
      }
    }

    // Only add keyword if it's COMPLETELY missing
    const keywordWords = targetKeyword.toLowerCase().split(/\s+/);
    const titleLower = optimizedTitle.toLowerCase();
    const hasKeywordContent = keywordWords.some(word => word.length > 3 && titleLower.includes(word));

    if (!hasKeywordContent) {
      // Incorporate naturally
      optimizedTitle = `The Truth About ${targetKeyword} (What Nobody Tells You)`;
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
  // Check for schema in both locations
  if (await fileExists(path.join(articlePath, 'schema.json')) ||
      await fileExists(path.join(articlePath, 'schema-markup/schema.json'))) {
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

/**
 * GET /api/website-content/:domainFolder/automation
 *
 * Gets automation configuration for a domain
 */
app.get('/api/website-content/:domainFolder/automation', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);

    // Check if website exists
    try {
      await fs.access(websitePath);
    } catch {
      return res.status(404).json({ error: 'Website not found' });
    }

    const configPath = path.join(websitePath, 'ai/blog-research/automation-config.json');

    let config = {
      enabled: false,
      domain: domainFolder,
      schedule: 'Daily at 3 AM',
      cronExpression: '0 3 * * *',
      lastRun: null,
      nextRun: null,
      totalProcessed: 0,
      history: []
    };

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      config = { ...config, ...JSON.parse(configContent) };
    } catch {
      // Config doesn't exist yet, use defaults
    }

    res.json(config);
  } catch (error) {
    console.error('Error getting automation config:', error);
    res.status(500).json({ error: 'Failed to get automation config', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/automation
 *
 * Updates automation configuration for a domain
 */
app.post('/api/website-content/:domainFolder/automation', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const { enabled, schedule, cronExpression } = req.body;
    const folderName = resolveFolderName(domainFolder);
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);

    // Check if website exists
    try {
      await fs.access(websitePath);
    } catch {
      return res.status(404).json({ error: 'Website not found' });
    }

    const configDir = path.join(websitePath, 'ai/blog-research');
    const configPath = path.join(configDir, 'automation-config.json');

    // Ensure directory exists
    await fs.mkdir(configDir, { recursive: true });

    // Load existing config or create new
    let config = {
      enabled: false,
      domain: domainFolder,
      schedule: 'Daily at 3 AM',
      cronExpression: '0 3 * * *',
      lastRun: null,
      nextRun: null,
      totalProcessed: 0,
      history: []
    };

    try {
      const existingContent = await fs.readFile(configPath, 'utf-8');
      config = { ...config, ...JSON.parse(existingContent) };
    } catch {
      // Config doesn't exist yet
    }

    // Update config
    if (typeof enabled === 'boolean') config.enabled = enabled;
    if (schedule) config.schedule = schedule;
    if (cronExpression) config.cronExpression = cronExpression;

    // Save config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    res.json({
      success: true,
      message: config.enabled ? 'Automation enabled' : 'Automation disabled',
      config
    });
  } catch (error) {
    console.error('Error updating automation config:', error);
    res.status(500).json({ error: 'Failed to update automation config', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/automation/trigger
 *
 * Manually triggers article research for the next item in queue with session tracking
 */
app.post('/api/website-content/:domainFolder/automation/trigger', async (req, res) => {
  try {
    const { domainFolder } = req.params;
    const folderName = resolveFolderName(domainFolder);
    const knowledgePath = await findAIKnowledgePath(folderName);

    if (!knowledgePath) {
      return res.status(404).json({ error: 'Website not found' });
    }

    // Load topical map to find next article
    const topicalMapPath = path.join(knowledgePath, '04-content-strategy/ready/topical-map.json');

    let topicalMap;
    try {
      const content = await fs.readFile(topicalMapPath, 'utf-8');
      topicalMap = JSON.parse(content);
    } catch {
      return res.status(404).json({
        error: 'No article queue found',
        message: 'Please generate a topical map first'
      });
    }

    // Find next article to process (status = 'planned')
    let nextArticle = null;
    let pillarTitle = '';
    let pillarId = '';

    for (const pillar of topicalMap.pillars || []) {
      for (const article of pillar.supportingArticles || []) {
        if (article.status === 'planned') {
          nextArticle = article;
          pillarTitle = pillar.title;
          pillarId = pillar.id;
          break;
        }
      }
      if (nextArticle) break;
    }

    if (!nextArticle) {
      return res.json({
        success: false,
        error: 'No articles in queue',
        message: 'All articles have been processed or are in progress'
      });
    }

    const articleSlug = slugify(nextArticle.title || nextArticle.id);
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);
    const articlePath = path.join(knowledgePath, '10-Blog-research', articleSlug);
    const sessionPath = path.join(articlePath, 'session.json');

    // Check for existing active session
    try {
      const existingSession = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
      const isRunning = await isProcessRunning(existingSession.pid);

      if (isRunning) {
        return res.status(409).json({
          error: 'Research already in progress',
          message: `Article "${nextArticle.title}" already has an active research session`,
          session: existingSession
        });
      }
    } catch {
      // No existing session, continue
    }

    // Create article directory
    await fs.mkdir(articlePath, { recursive: true });

    // Generate unique session ID
    const sessionId = `${articleSlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create research prompt with session tracking
    const researchPrompt = `# Autonomous Blog Article Research - Session ${sessionId}

**Website:** ${folderName}
**Article Title:** ${nextArticle.title}
**Target Keyword:** ${nextArticle.keyword || pillarTitle}
**Slug:** ${articleSlug}
**Session ID:** ${sessionId}

## Your Mission
Complete the full 9-phase blog research workflow for this article autonomously.

**Working Directory:** ${articlePath}/

## Phases to Complete
1. **Setup** - Create directory structure and research-summary.md
2. **Topic Research** - Save to topic-research/
3. **Keyword Research** - Save to keyword-research/
4. **Authority Link Research** - Save to authority-link-research/
5. **FAQ Research** - Save to faq-research/
6. **Quality Review** - Create research-quality-approved.json
7. **Article Outline** - Create article-plan.md
8. **Write Draft** - Create article-draft.md (3500-5000 words)
9. **HTML Creation** - Create article-final.html
10. **Schema Markup** - Create schema.json

## IMPORTANT
- Work autonomously until ALL phases are complete
- Update research-summary.md with progress
- When finished, article-final.html and schema.json must exist

Begin now.`;

    // Log file for this research
    const logDir = path.join(websitePath, 'ai/blog-research/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `${sessionId}.log`);

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

    const pid = claude.pid;

    // Save session info
    const sessionData = {
      sessionId,
      articleId: `${pillarId}-${nextArticle.id}`,
      articleTitle: nextArticle.title,
      targetKeyword: nextArticle.keyword || pillarTitle,
      slug: articleSlug,
      pid,
      status: 'running',
      startTime: new Date().toISOString(),
      logPath,
      domain: domainFolder,
      source: 'automation-trigger'
    };

    await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));

    if (claude.stdin) {
      claude.stdin.write(researchPrompt + '\n');
      claude.stdin.end();
    }

    claude.unref();
    await logFd.close();

    // Update article status to 'researching' with session ID
    nextArticle.status = 'researching';
    nextArticle.sessionId = sessionId;
    await fs.writeFile(topicalMapPath, JSON.stringify(topicalMap, null, 2));

    // Update automation config with history
    const configPath = path.join(websitePath, 'ai/blog-research/automation-config.json');
    let config = { history: [], totalProcessed: 0 };
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch {}

    config.history = config.history || [];
    config.history.unshift({
      timestamp: new Date().toISOString(),
      articleTitle: nextArticle.title,
      articleId: nextArticle.id,
      sessionId,
      status: 'started'
    });
    config.history = config.history.slice(0, 20); // Keep last 20
    config.totalProcessed = (config.totalProcessed || 0) + 1;
    config.lastRun = new Date().toISOString();

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    res.json({
      success: true,
      message: 'Article research started with session tracking',
      session: sessionData
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    res.status(500).json({ error: 'Failed to trigger automation', details: error.message });
  }
});

/**
 * POST /api/website-content/:domainFolder/qc-fix
 *
 * Executes a QC fix for an incomplete article - runs the actual fix via Claude Code
 */
app.post('/api/website-content/:domainFolder/qc-fix', async (req, res) => {
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

    // Check if article exists
    try {
      await fs.access(articlePath);
    } catch {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check what phases are completed to determine what needs fixing
    const phaseStatus = await checkPhaseStatus(articlePath);

    if (phaseStatus.nextPhase >= 10) {
      return res.json({
        success: true,
        message: 'Article already complete - no fix needed',
        status: 'complete'
      });
    }

    // Generate session ID
    const sessionId = `qc-fix-${slug}-${Date.now()}`;
    const websitePath = path.join(JOSH_AI_WEBSITES_DIR, folderName);
    const sessionPath = path.join(articlePath, 'session.json');

    // Check for existing running session
    try {
      const existingSession = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
      const isRunning = await isProcessRunning(existingSession.pid);

      if (isRunning) {
        return res.status(409).json({
          error: 'Fix already in progress',
          message: `Article "${slug}" already has an active session`,
          session: existingSession
        });
      }
    } catch {
      // No existing session
    }

    // Read research summary for context
    let articleTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let targetKeyword = '';

    try {
      const summaryContent = await fs.readFile(path.join(articlePath, 'research-summary.md'), 'utf-8');
      const titleMatch = summaryContent.match(/\*\*Article Title:\*\*\s+(.+)/);
      const keywordMatch = summaryContent.match(/\*\*Target Keyword:\*\*\s+(.+)/);
      if (titleMatch) articleTitle = titleMatch[1].trim();
      if (keywordMatch) targetKeyword = keywordMatch[1].trim();
    } catch {
      // Use defaults
    }

    // Build the fix prompt based on what's missing
    let fixPrompt = `# QC Fix Task - ${articleTitle}

**Session ID:** ${sessionId}
**Article Directory:** ${articlePath}
**Website:** ${folderName}
**Current Phase:** ${phaseStatus.nextPhase}
**Completed Phases:** ${phaseStatus.completed.join(', ')}

## What Needs Fixing
`;

    // Determine what's missing and add specific instructions
    if (phaseStatus.nextPhase <= 2) {
      fixPrompt += `
### Missing Research
Complete the research phase:
- topic-research/topic-research-report.md
- keyword-research/keyword-report.md
- authority-link-research/authority-sources.md
- faq-research/faq-report.md
`;
    }

    if (phaseStatus.nextPhase <= 3) {
      fixPrompt += `
### Missing Quality Review
Create research-quality-approved.json confirming research is complete.
`;
    }

    if (phaseStatus.nextPhase <= 4) {
      fixPrompt += `
### Missing Article Plan
Create article-plan.md with outline and structure.
`;
    }

    if (phaseStatus.nextPhase <= 5) {
      fixPrompt += `
### Missing Draft
Write article-draft.md (3500-5000 words, high-quality SEO content).
`;
    }

    if (phaseStatus.nextPhase <= 6) {
      fixPrompt += `
### Missing Internal Links
Create internal-links.json with relevant internal link suggestions.
`;
    }

    if (phaseStatus.nextPhase <= 7) {
      fixPrompt += `
### Missing HTML
Convert draft to article-final.html (professional formatting).
`;
    }

    if (phaseStatus.nextPhase <= 8) {
      fixPrompt += `
### Missing Final Review
Create final-review-approved.json confirming article is ready.
`;
    }

    if (phaseStatus.nextPhase <= 9) {
      fixPrompt += `
### Missing Schema
Create schema.json with proper Article structured data markup.
`;
    }

    fixPrompt += `
## Instructions
1. Read the existing research and draft files in ${articlePath}
2. Complete ONLY the missing components listed above
3. Do NOT redo completed phases
4. Work autonomously until schema.json exists

Begin immediately.`;

    // Log file
    const logDir = path.join(websitePath, 'ai/blog-research/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `${sessionId}.log`);

    // Spawn Claude Code
    const { spawn } = await import('child_process');
    const logFd = await fs.open(logPath, 'w');

    const claude = spawn('claude', [
      '--dangerously-skip-permissions',
      '--verbose'
    ], {
      cwd: '/home/josh/Josh-AI',
      stdio: ['pipe', logFd.fd, logFd.fd],
      detached: true
    });

    // Save session
    const sessionData = {
      sessionId,
      slug,
      articleTitle,
      targetKeyword,
      pid: claude.pid,
      status: 'running',
      startTime: new Date().toISOString(),
      logPath,
      domain: domainFolder,
      source: 'qc-fix',
      fixingFromPhase: phaseStatus.nextPhase
    };

    await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));

    if (claude.stdin) {
      claude.stdin.write(fixPrompt + '\n');
      claude.stdin.end();
    }

    claude.unref();
    await logFd.close();

    res.json({
      success: true,
      message: `QC fix started from Phase ${phaseStatus.nextPhase}`,
      session: sessionData,
      missingPhases: Array.from({ length: 10 - phaseStatus.nextPhase }, (_, i) => phaseStatus.nextPhase + i)
    });
  } catch (error) {
    console.error('Error executing QC fix:', error);
    res.status(500).json({ error: 'Failed to execute QC fix', details: error.message });
  }
});

/**
 * GET /api/brands/:slug/content
 *
 * Scans client content folder for images and videos
 * Used by the Content Library feature
 */
app.get('/api/brands/:slug/content', async (req, res) => {
  try {
    const { slug } = req.params;
    const brandSlug = slug.toUpperCase();

    // Path to client's content folder in the social-approve-app
    const clientDir = path.join(
      JOSH_AI_WEBSITES_DIR,
      'JOSH-SOCIAL-APPROVE/social-approve-app/public/clients',
      brandSlug
    );

    try {
      await fs.access(clientDir);
    } catch {
      return res.json({
        error: `No content folder found for brand: ${brandSlug}`,
        files: [],
        stats: {
          total: 0,
          images: 0,
          videos: 0,
          byCategory: {
            'company-images': 0,
            'social-posts': 0,
            'logos': 0,
            'screenshots': 0,
            'other': 0
          }
        }
      });
    }

    // Scan for content files
    const files = await scanContentDirectory(clientDir, `/clients/${brandSlug}`);

    // Sort by modified date (newest first)
    files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    // Calculate stats
    const stats = {
      total: files.length,
      images: files.filter(f => f.type === 'image').length,
      videos: files.filter(f => f.type === 'video').length,
      byCategory: {
        'company-images': files.filter(f => f.category === 'company-images').length,
        'social-posts': files.filter(f => f.category === 'social-posts').length,
        'logos': files.filter(f => f.category === 'logos').length,
        'screenshots': files.filter(f => f.category === 'screenshots').length,
        'other': files.filter(f => f.category === 'other').length
      }
    };

    res.json({
      brandSlug,
      files,
      stats
    });
  } catch (error) {
    console.error('Error scanning brand content:', error);
    res.status(500).json({
      error: 'Failed to scan content files',
      details: error.message
    });
  }
});

// Helper: Scan content directory recursively
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

function getCategoryFromPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('company-images') || lower.includes('company_images')) return 'company-images';
  if (lower.includes('social-posts/approved') || lower.includes('approved')) return 'social-posts';
  if (lower.includes('social-posts/scheduled') || lower.includes('scheduled')) return 'social-posts';
  if (lower.includes('logos') || lower.includes('logo')) return 'logos';
  if (lower.includes('screenshots') || lower.includes('screenshot')) return 'screenshots';
  return 'other';
}

function getStatusFromPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('/approved/')) return 'approved';
  if (lower.includes('/scheduled/')) return 'scheduled';
  return 'pending';
}

async function scanContentDirectory(dirPath, baseUrl, relativePath = '') {
  const files = [];

  try {
    await fs.access(dirPath);
  } catch {
    return files;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryRelativePath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = await scanContentDirectory(fullPath, baseUrl, entryRelativePath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const fileType = getFileType(entry.name);
      if (fileType) {
        const stats = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          path: entryRelativePath,
          url: `${baseUrl}/${entryRelativePath.replace(/\\/g, '/')}`,
          type: fileType,
          category: getCategoryFromPath(entryRelativePath),
          status: getStatusFromPath(entryRelativePath),
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }
  }

  return files;
}

// ============================================
// CONTENT LIBRARY UPLOAD ENDPOINTS
// ============================================

// Configure multer for file uploads
const CLIENTS_DIR = path.join(JOSH_AI_WEBSITES_DIR, 'JOSH-SOCIAL-APPROVE/social-approve-app/public/clients');

// Temporary storage - files are processed and moved to final location
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

/**
 * Generate SEO-friendly filename from customer note
 */
function generateSeoFilename(note, originalFilename, brandSlug) {
  // Get file extension
  const ext = path.extname(originalFilename).toLowerCase();

  // If no note provided, use a sanitized version of original name
  if (!note || note.trim() === '') {
    const baseName = path.basename(originalFilename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    return `${brandSlug.toLowerCase()}-${baseName}-${Date.now()}${ext}`;
  }

  // Convert note to SEO-friendly slug
  const seoSlug = note
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')           // Spaces to dashes
    .replace(/-+/g, '-')            // Multiple dashes to single
    .substring(0, 60)               // Limit length
    .replace(/^-+|-+$/g, '');       // Trim dashes from ends

  // Add brand prefix and timestamp for uniqueness
  const timestamp = Date.now();
  return `${brandSlug.toLowerCase()}-${seoSlug}-${timestamp}${ext}`;
}

/**
 * Load content library metadata for a brand
 */
async function loadContentMetadata(brandSlug) {
  const metadataPath = path.join(CLIENTS_DIR, brandSlug.toUpperCase(), 'uploads', 'content-metadata.json');
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { files: [], lastUpdated: null };
  }
}

/**
 * Save content library metadata for a brand
 */
async function saveContentMetadata(brandSlug, metadata) {
  const uploadsDir = path.join(CLIENTS_DIR, brandSlug.toUpperCase(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  metadata.lastUpdated = new Date().toISOString();
  const metadataPath = path.join(uploadsDir, 'content-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * POST /api/brands/:slug/upload
 *
 * Upload an image or video to the content library
 * Accepts multipart form data with:
 * - file: The image/video file
 * - note: Customer description of the content
 * - category: Optional category (uploads, company-images, etc.)
 */
app.post('/api/brands/:slug/upload', upload.single('file'), async (req, res) => {
  try {
    const { slug } = req.params;
    const brandSlug = slug.toUpperCase();
    const { note, category = 'uploads' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if client directory exists
    const clientDir = path.join(CLIENTS_DIR, brandSlug);
    try {
      await fs.access(clientDir);
    } catch {
      return res.status(404).json({ error: `Brand folder not found: ${brandSlug}` });
    }

    // Determine file type
    const isVideo = req.file.mimetype.startsWith('video/');
    const fileType = isVideo ? 'video' : 'image';

    // Generate SEO filename
    const seoFilename = generateSeoFilename(note, req.file.originalname, brandSlug);

    // Determine storage path based on category
    let categoryFolder = 'uploads';
    if (['company-images', 'logos', 'screenshots'].includes(category)) {
      categoryFolder = category;
    }

    const relativePath = path.join(categoryFolder, seoFilename);
    const absolutePath = path.join(clientDir, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    let width = null;
    let height = null;
    let finalBuffer = req.file.buffer;

    // Process images with sharp (optimize and get dimensions)
    if (fileType === 'image' && !req.file.mimetype.includes('svg')) {
      try {
        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();

        width = metadata.width;
        height = metadata.height;

        // If image is larger than 2000px, resize it
        if (metadata.width > 2000 || metadata.height > 2000) {
          finalBuffer = await image
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

          // Update metadata after resize
          const resizedMeta = await sharp(finalBuffer).metadata();
          width = resizedMeta.width;
          height = resizedMeta.height;
        } else if (req.file.mimetype === 'image/png' && req.file.buffer.length > 500 * 1024) {
          // Convert large PNGs to JPEG
          finalBuffer = await image
            .jpeg({ quality: 85 })
            .toBuffer();
        }
      } catch (err) {
        console.error('Image processing error:', err);
        // Use original buffer if processing fails
      }
    }

    // Save the file
    await fs.writeFile(absolutePath, finalBuffer);

    // Get final file size
    const stats = await fs.stat(absolutePath);

    // Create file metadata
    const fileMetadata = {
      id: `${brandSlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalFilename: req.file.originalname,
      seoFilename,
      customerNote: note || '',
      altText: note ? note.substring(0, 200) : req.file.originalname,
      fileType,
      mimeType: req.file.mimetype,
      fileSize: stats.size,
      width,
      height,
      storagePath: relativePath,
      url: `/clients/${brandSlug}/${relativePath}`,
      category: categoryFolder,
      status: 'pending',
      usageCount: 0,
      createdAt: new Date().toISOString()
    };

    // Update content metadata file
    const metadata = await loadContentMetadata(brandSlug);
    metadata.files.unshift(fileMetadata);  // Add to beginning (newest first)
    await saveContentMetadata(brandSlug, metadata);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileMetadata
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

/**
 * GET /api/brands/:slug/library
 *
 * Get content library with metadata (notes, SEO names, usage)
 */
app.get('/api/brands/:slug/library', async (req, res) => {
  try {
    const { slug } = req.params;
    const brandSlug = slug.toUpperCase();

    // Load metadata
    const metadata = await loadContentMetadata(brandSlug);

    // Also scan for files that might not be in metadata (legacy files)
    const clientDir = path.join(CLIENTS_DIR, brandSlug);
    try {
      await fs.access(clientDir);
    } catch {
      return res.json({
        brandSlug,
        files: metadata.files,
        stats: {
          total: metadata.files.length,
          tracked: metadata.files.length,
          untracked: 0
        }
      });
    }

    // Get all files from the content scan endpoint
    const allFiles = await scanContentDirectory(clientDir, `/clients/${brandSlug}`);

    // Cross-reference with metadata
    const trackedPaths = new Set(metadata.files.map(f => f.url));
    const untrackedFiles = allFiles.filter(f => !trackedPaths.has(f.url));

    // Add untracked files with basic info
    const untrackedWithMeta = untrackedFiles.map(f => ({
      id: `untracked-${f.path.replace(/\//g, '-')}`,
      originalFilename: f.name,
      seoFilename: f.name,
      customerNote: null,
      altText: f.name,
      fileType: f.type,
      mimeType: null,
      fileSize: f.size,
      width: null,
      height: null,
      storagePath: f.path,
      url: f.url,
      category: f.category,
      status: f.status || 'untracked',
      usageCount: 0,
      createdAt: f.modified,
      isUntracked: true
    }));

    // Combine tracked and untracked
    const allFilesWithMeta = [...metadata.files, ...untrackedWithMeta];

    res.json({
      brandSlug,
      files: allFilesWithMeta,
      lastUpdated: metadata.lastUpdated,
      stats: {
        total: allFilesWithMeta.length,
        tracked: metadata.files.length,
        untracked: untrackedWithMeta.length
      }
    });

  } catch (error) {
    console.error('Error getting library:', error);
    res.status(500).json({
      error: 'Failed to get content library',
      details: error.message
    });
  }
});

/**
 * PATCH /api/brands/:slug/library/:fileId
 *
 * Update file metadata (note, category, status)
 */
app.patch('/api/brands/:slug/library/:fileId', async (req, res) => {
  try {
    const { slug, fileId } = req.params;
    const brandSlug = slug.toUpperCase();
    const updates = req.body;

    const metadata = await loadContentMetadata(brandSlug);
    const fileIndex = metadata.files.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found in library' });
    }

    // Apply allowed updates
    const allowedFields = ['customerNote', 'altText', 'category', 'status'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        metadata.files[fileIndex][field] = updates[field];
      }
    }

    metadata.files[fileIndex].updatedAt = new Date().toISOString();

    await saveContentMetadata(brandSlug, metadata);

    res.json({
      success: true,
      file: metadata.files[fileIndex]
    });

  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      error: 'Failed to update file',
      details: error.message
    });
  }
});

/**
 * DELETE /api/brands/:slug/library/:fileId
 *
 * Delete a file from the content library
 */
app.delete('/api/brands/:slug/library/:fileId', async (req, res) => {
  try {
    const { slug, fileId } = req.params;
    const brandSlug = slug.toUpperCase();

    const metadata = await loadContentMetadata(brandSlug);
    const fileIndex = metadata.files.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found in library' });
    }

    const file = metadata.files[fileIndex];

    // Delete the actual file
    const absolutePath = path.join(CLIENTS_DIR, brandSlug, file.storagePath);
    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      console.error('Error deleting file from disk:', err);
      // Continue with metadata removal even if file delete fails
    }

    // Remove from metadata
    metadata.files.splice(fileIndex, 1);
    await saveContentMetadata(brandSlug, metadata);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`JAM Social API server running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: *.jamsocial.app, localhost`);
});
