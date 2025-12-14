import { NextResponse } from 'next/server';
import { listCategories, isConfigured } from '@/lib/oneup';

// GET - Fetch OneUp categories
export async function GET() {
  try {
    // Check if OneUp is configured
    if (!isConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'OneUp API key not configured',
        categories: [],
      });
    }

    const categories = await listCategories();

    return NextResponse.json({
      configured: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching OneUp categories:', error);
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        categories: [],
      },
      { status: 500 }
    );
  }
}
