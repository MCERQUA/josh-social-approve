import { NextResponse } from 'next/server';
import { getTenant, getTenantBrands } from '@/lib/tenant';

// GET - Fetch current tenant info and their brands
export async function GET() {
  try {
    const tenant = await getTenant();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const brands = await getTenantBrands();

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        email: tenant.email,
        logo_url: tenant.logo_url,
        primary_color: tenant.primary_color,
      },
      brands: brands.map((brand: Record<string, unknown>) => ({
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
        short_name: brand.short_name,
        oneup_category_id: brand.oneup_category_id,
        color: brand.color,
        logo_url: brand.logo_url,
        website_url: brand.website_url,
      })),
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}
