import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { domain, phaseId, prompt } = await request.json();

    if (!domain || !phaseId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, phaseId, prompt' },
        { status: 400 }
      );
    }

    // Path to store the custom prompts
    const websitesDir = join(process.cwd(), '..', '..', '..', 'websites', domain);
    const promptsDir = join(websitesDir, 'ai', 'blog-research', 'prompts');

    // Ensure prompts directory exists
    if (!existsSync(promptsDir)) {
      await mkdir(promptsDir, { recursive: true });
    }

    // Extract phase number from phaseId (e.g., "phase-1" -> "01")
    const phaseMatch = phaseId.match(/phase-(\d+)/);
    const phaseNumber = phaseMatch ? phaseMatch[1].padStart(2, '0') : '00';

    // Map phase IDs to prompt filenames (matching the planning document)
    const promptFileMap: Record<string, string> = {
      'phase-1': '01-keyword-research.txt',
      'phase-2': '02-competitor-analysis.txt',
      'phase-3': '03-authority-sources.txt',
      'phase-4': '04-content-structure.txt',
      'phase-5': '05-eeat-examples.txt',
      'phase-6': '06-distribution.txt',
      'phase-7': '07-final-audit.txt',
    };

    const promptFileName = promptFileMap[phaseId] || `${phaseNumber}-custom-prompt.txt`;
    const promptPath = join(promptsDir, promptFileName);

    // Write the updated prompt
    await writeFile(promptPath, prompt, 'utf-8');

    // Also maintain a backup/versioned copy
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(promptsDir, 'backups', `${promptFileName}.${timestamp}.backup`);

    // Ensure backup directory exists
    const backupDir = join(promptsDir, 'backups');
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    await writeFile(backupPath, prompt, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Prompt updated successfully',
      promptPath: promptPath.replace(process.cwd(), ''),
      backupPath: backupPath.replace(process.cwd(), '')
    });
  } catch (error) {
    console.error('Error updating blog workflow prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
