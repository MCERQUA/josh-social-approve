import { headers } from 'next/headers';
import { sql } from '@/lib/db';

export interface Tenant {
  id: number;
  subdomain: string;
  name: string;
  email: string | null;
  clerk_user_id: string | null;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Get the current tenant subdomain from the request headers.
 * Set by middleware based on the hostname.
 */
export async function getTenantSubdomain(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-tenant-subdomain') || 'josh';
}

/**
 * Get the full tenant record from the database.
 * Returns null if tenant doesn't exist.
 */
export async function getTenant(): Promise<Tenant | null> {
  const subdomain = await getTenantSubdomain();

  const result = await sql`
    SELECT * FROM tenants WHERE subdomain = ${subdomain} AND is_active = true
  `;

  if (result.length === 0) {
    return null;
  }

  return result[0] as Tenant;
}

/**
 * Get tenant ID from subdomain.
 * Returns null if tenant doesn't exist.
 */
export async function getTenantId(): Promise<number | null> {
  const tenant = await getTenant();
  return tenant?.id || null;
}

/**
 * Get all brands for the current tenant.
 */
export async function getTenantBrands() {
  const tenantId = await getTenantId();

  if (!tenantId) {
    return [];
  }

  const result = await sql`
    SELECT * FROM brands WHERE tenant_id = ${tenantId} ORDER BY name
  `;

  return result;
}

/**
 * Verify that a brand belongs to the current tenant.
 * Returns the brand if it exists and belongs to the tenant, null otherwise.
 */
export async function verifyBrandAccess(brandSlug: string) {
  const tenantId = await getTenantId();

  if (!tenantId) {
    return null;
  }

  const result = await sql`
    SELECT * FROM brands WHERE slug = ${brandSlug} AND tenant_id = ${tenantId}
  `;

  return result.length > 0 ? result[0] : null;
}

/**
 * Check if current tenant has access to a specific brand.
 */
export async function hasBrandAccess(brandSlug: string): Promise<boolean> {
  const brand = await verifyBrandAccess(brandSlug);
  return brand !== null;
}
