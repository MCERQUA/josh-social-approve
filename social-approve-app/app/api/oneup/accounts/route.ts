import { NextRequest, NextResponse } from 'next/server';
import { listCategoryAccounts, isConfigured } from '@/lib/oneup';

// GET - Fetch accounts for a category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      );
    }

    // Check if OneUp is configured
    if (!isConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'OneUp API key not configured',
        accounts: [],
      });
    }

    const accounts = await listCategoryAccounts(parseInt(categoryId, 10));

    return NextResponse.json({
      configured: true,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching OneUp accounts:', error);
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : 'Failed to fetch accounts',
        accounts: [],
      },
      { status: 500 }
    );
  }
}
