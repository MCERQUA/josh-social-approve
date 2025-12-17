import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tests: Record<string, string> = {};

  // Test 1: Basic
  tests.basic = 'ok';

  // Test 2: Try importing sharp
  try {
    const sharp = await import('sharp');
    tests.sharp = `loaded (${typeof sharp.default})`;
  } catch (e) {
    tests.sharp = `failed: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  // Test 3: Check Gemini API key
  tests.gemini_key = process.env.GEMINI_API_KEY ? 'set' : 'missing';

  // Test 4: Check GitHub
  tests.github_token = process.env.GITHUB_TOKEN ? 'set' : 'missing';
  tests.github_repo = process.env.GITHUB_REPO || 'missing';

  // Test 5: Try importing brand config
  try {
    const { getBrandImageConfig } = await import('@/lib/brand-image-config');
    const config = await getBrandImageConfig(1);
    tests.brand_config = config ? `loaded (${config.brandName})` : 'null';
  } catch (e) {
    tests.brand_config = `failed: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  return NextResponse.json({ tests, timestamp: new Date().toISOString() });
}
