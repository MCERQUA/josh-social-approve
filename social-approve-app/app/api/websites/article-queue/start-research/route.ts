import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

/**
 * POST /api/websites/article-queue/start-research
 *
 * Triggers the /research-article slash command for a specific article.
 * This is a fully autonomous 9-phase process that creates publication-ready content.
 *
 * Body: { domain: string, articleId: string, title: string, keyword: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, articleId, title, keyword } = body;

    if (!domain || !articleId || !title || !keyword) {
      return NextResponse.json({
        error: 'Missing required parameters',
        required: ['domain', 'articleId', 'title', 'keyword']
      }, { status: 400 });
    }

    // Validate domain exists
    const websiteDir = path.join('/home/josh/Josh-AI/websites', domain);
    try {
      await fs.access(websiteDir);
    } catch {
      return NextResponse.json({
        error: 'Website not found',
        message: `No website found at ${websiteDir}`
      }, { status: 404 });
    }

    // Create article slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Read the slash command template and build the full prompt
    const commandPath = '/home/josh/Josh-AI/.claude/commands/research-article.md';
    let promptTemplate: string;

    try {
      promptTemplate = await fs.readFile(commandPath, 'utf-8');
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Article research command not found',
        message: `Could not load command from ${commandPath}`
      }, { status: 500 });
    }

    // Build the full prompt with article details
    const prompt = `${promptTemplate}

# Article Details

**Website:** ${domain}
**Article Title:** ${title}
**Target Keyword:** ${keyword}
**Article Slug:** ${slug}

**CRITICAL:** Run ALL 9 phases autonomously without stopping. Use all the specialized agents (topic-research-agent, keyword-research-agent, seo-analysis-agent, source-discovery-agent) as specified in the workflow above.`;

    // Create status file for tracking
    const statusFile = `/tmp/article-research-${domain}-${slug}.json`;
    await fs.writeFile(statusFile, JSON.stringify({
      type: 'article-research',
      domain,
      articleId,
      title,
      keyword,
      slug,
      status: 'starting',
      phase: 1,
      totalPhases: 9,
      startTime: Date.now()
    }), 'utf-8');

    console.log(`[ARTICLE-RESEARCH] Starting research for: ${title}`);
    console.log(`[ARTICLE-RESEARCH] Domain: ${domain}`);
    console.log(`[ARTICLE-RESEARCH] Keyword: ${keyword}`);
    console.log(`[ARTICLE-RESEARCH] Slug: ${slug}`);

    // Update article status to in_progress
    try {
      await fetch(`http://localhost:6345/api/websites/article-queue/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          articleId,
          status: 'in_progress'
        })
      });
      console.log(`[ARTICLE-RESEARCH] Status updated to in_progress`);
    } catch (err) {
      console.error('[ARTICLE-RESEARCH] Failed to update status:', err);
      // Don't fail the whole request if status update fails
    }

    // Create log file for this article's execution
    const logPath = `/home/josh/Josh-AI/logs/articles/${domain}-${slug}-${Date.now()}.log`;

    // Write initial log header
    const logHeader = `=== Article Research Started ===
Domain: ${domain}
Title: ${title}
Keyword: ${keyword}
Slug: ${slug}
Started: ${new Date().toISOString()}
================================

`;
    await fs.writeFile(logPath, logHeader, 'utf-8');

    // Open log file for appending (Node.js will handle the stream in child process)
    const logFd = await fs.open(logPath, 'a');

    // Execute Claude Code session with the /research-article command
    // Use detached mode so it survives app restarts!
    const claude = spawn('claude', [
      'code',
      '--dangerously-skip-permissions',
      '--verbose'
    ], {
      cwd: '/home/josh/Josh-AI',
      stdio: ['pipe', logFd.fd, logFd.fd],  // ✅ FIX #2: Use file descriptor for logging
      detached: true
    });

    // Send the prompt
    if (claude.stdin) {
      claude.stdin.write(prompt + '\n');
      claude.stdin.end();
    }

    // Unref so parent can exit without waiting
    claude.unref();

    console.log(`[ARTICLE-RESEARCH] Prompt sent to Claude Code (detached mode, PID: ${claude.pid})`);
    console.log(`[ARTICLE-RESEARCH] Output logging to: ${logPath}`);

    // Set up completion handler (runs in background after we return response)
    // Don't wait for completion - return immediately
    // The process will run in the background
    if (claude && typeof claude.on === 'function') {
      claude.on('close', async (code) => {
      console.log(`[ARTICLE-RESEARCH] Claude Code exited with code ${code}`);

      // Close log file descriptor
      await logFd.close();

      // Append completion info to log
      const logFooter = `
================================
Ended: ${new Date().toISOString()}
Exit Code: ${code}
================================
`;
      await fs.appendFile(logPath, logFooter, 'utf-8').catch(() => {});

      // ✅ FIX #1: Validate actual deliverables exist before marking complete
      const outputPath = `/home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${slug}`;

      const requiredFiles = {
        draft: `${outputPath}/article-draft.md`,
        html: `${outputPath}/article-final.html`,
        schema: `${outputPath}/schema.json`,
        schemaAlt: `${outputPath}/schema-markup/schema.json`
      };

      // Check which files exist
      const fileChecks = await Promise.all([
        fs.access(requiredFiles.draft).then(() => true).catch(() => false),
        fs.access(requiredFiles.html).then(() => true).catch(() => false),
        fs.access(requiredFiles.schema).then(() => true).catch(() => false).then(async (exists) => {
          if (!exists) {
            return await fs.access(requiredFiles.schemaAlt).then(() => true).catch(() => false);
          }
          return exists;
        })
      ]);

      const [hasDraft, hasHtml, hasSchema] = fileChecks;
      const missingFiles: string[] = [];

      if (!hasDraft) missingFiles.push('article-draft.md');
      if (!hasHtml) missingFiles.push('article-final.html');
      if (!hasSchema) missingFiles.push('schema.json');

      // ✅ FIX #3: Determine actual completion based on file existence
      const actuallyCompleted = code === 0 && hasDraft && hasHtml && hasSchema;
      const finalStatus = actuallyCompleted ? 'completed' : 'failed';

      console.log(`[ARTICLE-RESEARCH] File validation:`);
      console.log(`  - article-draft.md: ${hasDraft ? '✅' : '❌'}`);
      console.log(`  - article-final.html: ${hasHtml ? '✅' : '❌'}`);
      console.log(`  - schema.json: ${hasSchema ? '✅' : '❌'}`);
      console.log(`[ARTICLE-RESEARCH] Actual status: ${finalStatus}${missingFiles.length > 0 ? ` (missing: ${missingFiles.join(', ')})` : ''}`);

      // Update status file with actual completion data
      try {
        await fs.writeFile(statusFile, JSON.stringify({
          type: 'article-research',
          domain,
          articleId,
          title,
          keyword,
          slug,
          status: finalStatus,
          phase: actuallyCompleted ? 9 : 'incomplete',
          totalPhases: 9,
          startTime: Date.now(),
          endTime: Date.now(),
          exitCode: code,
          validation: {
            hasDraft,
            hasHtml,
            hasSchema,
            missingFiles
          },
          logFile: logPath
        }), 'utf-8');
      } catch (err) {
        console.error('[ARTICLE-RESEARCH] Failed to update status:', err);
      }

      // Update article status in queue with actual completion
      try {
        await fetch(`http://localhost:6345/api/websites/article-queue/update-status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain,
            articleId,
            status: finalStatus,
            validation: {
              exitCode: code,
              filesComplete: actuallyCompleted,
              missingFiles
            }
          })
        });
        console.log(`[ARTICLE-RESEARCH] Queue status updated to ${finalStatus}`);
      } catch (err) {
        console.error('[ARTICLE-RESEARCH] Failed to update queue status:', err);
      }

      // ✅ AUTO-RESUME: If draft exists but HTML/schema missing, automatically trigger resume for Phases 7-9
      const needsResume = hasDraft && (!hasHtml || !hasSchema);
      if (needsResume && code === 0) {
        console.log(`[ARTICLE-RESEARCH] 🔄 Auto-resuming for Phases 7-9...`);
        console.log(`[ARTICLE-RESEARCH] Draft complete but missing: ${missingFiles.join(', ')}`);

        try {
          // Wait 5 seconds before triggering resume to allow cleanup
          await new Promise(resolve => setTimeout(resolve, 5000));

          const resumeResponse = await fetch(`http://localhost:6345/api/websites/article-queue/resume-research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain,
              slug
            })
          });

          const resumeData = await resumeResponse.json();

          if (resumeData.success) {
            console.log(`[ARTICLE-RESEARCH] ✅ Auto-resume triggered successfully`);
            console.log(`[ARTICLE-RESEARCH] Resuming from Phase ${resumeData.resumedFrom}`);
          } else {
            console.error(`[ARTICLE-RESEARCH] ❌ Auto-resume failed:`, resumeData.error);
          }
        } catch (resumeErr) {
          console.error('[ARTICLE-RESEARCH] Auto-resume error:', resumeErr);
        }
      }
      });
    }

    // Return immediately - research will continue in background
    return NextResponse.json({
      success: true,
      message: `Article research started for: ${title}`,
      domain,
      articleId,
      title,
      keyword,
      slug,
      status: 'processing',
      estimatedTime: '30-45 minutes',
      outputLocation: `/home/josh/Josh-AI/websites/${domain}/ai/knowledge/10-Blog-research/${slug}/`,
      showToast: true,
      toastType: 'info',
      toastMessage: `🚀 Research started for "${title}" - This will run autonomously for ~30-45 minutes`
    });

  } catch (error: any) {
    console.error('[ARTICLE-RESEARCH] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start article research',
      details: error.message
    }, { status: 500 });
  }
}
