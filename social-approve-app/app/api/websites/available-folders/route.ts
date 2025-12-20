import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// VPS API for filesystem access
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

interface AvailableWebsite {
  folder: string;
  hasAI: boolean;
}

/**
 * GET /api/websites/available-folders
 *
 * Returns list of available Josh-AI website folders that can be connected.
 */
export async function GET() {
  try {
    const response = await fetch(`${VPS_API_URL}/api/websites/available`);

    if (!response.ok) {
      console.error('VPS API error:', response.status);
      return NextResponse.json({ websites: [] });
    }

    const data = await response.json();

    // Filter to only show folders with AI content (topical maps, etc.)
    const foldersWithContent = (data.websites || [])
      .filter((w: AvailableWebsite) => w.hasAI)
      .map((w: AvailableWebsite) => ({
        folder: w.folder,
        label: formatFolderName(w.folder)
      }));

    return NextResponse.json({ folders: foldersWithContent });
  } catch (error) {
    console.error('Error fetching available folders:', error);
    return NextResponse.json({ folders: [] });
  }
}

function formatFolderName(folder: string): string {
  // Convert folder names to readable labels
  return folder
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
