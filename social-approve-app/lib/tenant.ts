import { headers } from 'next/headers';
import { sql } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';

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
 *
 * Priority order:
 * 1. Subdomain from URL (if not 'josh' default)
 * 2. User's linked tenant by clerk_user_id
 * 3. User's email match to existing tenant
 * 4. Create new tenant for user
 * 5. Fall back to subdomain
 *
 * This allows Josh to view other tenants (like edi.jamsocial.app) while logged in.
 */
export async function getTenant(): Promise<Tenant | null> {
  // FIRST: Check subdomain - if it's a specific subdomain (not default), use it
  const subdomain = await getTenantSubdomain();

  // If subdomain is set and NOT the default 'josh', prioritize it
  // This allows Josh to view client dashboards by visiting their subdomain
  if (subdomain && subdomain !== 'josh') {
    const subdomainTenant = await sql`
      SELECT * FROM tenants WHERE subdomain = ${subdomain} AND is_active = true
    `;

    if (subdomainTenant.length > 0) {
      return subdomainTenant[0] as Tenant;
    }
  }

  // SECOND: Try to get the current user's tenant by Clerk ID
  try {
    const { userId } = await auth();

    if (userId) {
      // Check if user already has a tenant
      const userTenant = await sql`
        SELECT * FROM tenants WHERE clerk_user_id = ${userId} AND is_active = true
      `;

      if (userTenant.length > 0) {
        return userTenant[0] as Tenant;
      }

      // No tenant for this user - check if their email matches an existing tenant
      const user = await currentUser();
      const userEmail = user?.primaryEmailAddress?.emailAddress || null;

      if (userEmail) {
        // Try to link user to existing tenant by email
        const emailTenant = await sql`
          SELECT * FROM tenants WHERE email = ${userEmail} AND is_active = true
        `;

        if (emailTenant.length > 0) {
          // Link this Clerk user to the existing tenant
          await sql`
            UPDATE tenants SET clerk_user_id = ${userId} WHERE id = ${emailTenant[0].id}
          `;
          return { ...emailTenant[0], clerk_user_id: userId } as Tenant;
        }
      }

      // Create a new tenant for this user
      const userName = user?.fullName || user?.firstName || 'New User';
      // Create a unique subdomain from user ID
      const userSubdomain = userId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 20);

      const newTenant = await sql`
        INSERT INTO tenants (subdomain, name, email, clerk_user_id, primary_color, is_active)
        VALUES (${userSubdomain}, ${userName}, ${userEmail}, ${userId}, '#3B82F6', true)
        RETURNING *
      `;

      return newTenant[0] as Tenant;
    }
  } catch (e) {
    // Auth might fail in some contexts - fall back to subdomain
    console.log('Auth check failed, falling back to subdomain:', e);
  }

  // Fall back to subdomain-based lookup (for unauthenticated or API contexts)
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
