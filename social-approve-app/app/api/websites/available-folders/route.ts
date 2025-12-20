import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// VPS API for filesystem access
const VPS_API_URL = process.env.VPS_API_URL || 'http://api.jamsocial.app';

interface AvailableWebsite {
  folder: string;
  hasAI: boolean;
  hasTopicalMap?: boolean;
}

// Friendly folder names for common websites
const FOLDER_LABELS: Record<string, string> = {
  'ICA-Website': 'ICA - Insulation Contractors of Arizona',
  'foamologyinsulation-web': 'Foamology Insulation',
  'CCA': 'Contractors Choice Agency',
  'humble-help-roofing': 'Humble Help Roofing',
  'framing-insurance': 'Framing Insurance',
  'better-home-performance': 'Better Home Performance',
  'chandler-business-center': 'Chandler Business Center',
  'roofinginsurance': 'Roofing Insurance',
  'arizonainsulationremoval': 'Arizona Insulation Removal',
  'hoodventinsurance': 'Hood Vent Insurance',
  'bungee-jumping-insurance': 'Bungee Jumping Insurance',
  'EDI-sprayfoam': 'EDI Spray Foam',
};

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
      return NextResponse.json({ folders: [] });
    }

    const data = await response.json();

    // Filter to only show folders with AI content (topical maps, etc.)
    const foldersWithContent = (data.websites || [])
      .filter((w: AvailableWebsite) => w.hasAI)
      .map((w: AvailableWebsite) => ({
        folder: w.folder,
        label: FOLDER_LABELS[w.folder] || formatFolderName(w.folder),
        hasTopicalMap: w.hasTopicalMap || false
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
