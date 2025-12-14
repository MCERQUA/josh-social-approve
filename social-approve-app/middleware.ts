import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Reserved subdomains that are NOT tenant subdomains
const RESERVED_SUBDOMAINS = ['www', 'api', 'app', 'video', 'admin', 'staging', 'dev'];

// Extract subdomain from hostname
function getSubdomain(hostname: string): string | null {
  // Handle localhost development
  if (hostname.includes('localhost')) {
    // In dev, use query param or default to 'josh'
    return null; // Will be handled by query param fallback
  }

  // Production: extract from hostname (e.g., josh.jamsocial.app)
  const parts = hostname.split('.');

  // Needs at least 3 parts: subdomain.domain.tld
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // Check if it's a reserved subdomain
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return null;
    }

    return subdomain.toLowerCase();
  }

  return null;
}

export default clerkMiddleware(async (auth, request) => {
  // Extract subdomain
  const hostname = request.headers.get('host') || '';
  let subdomain = getSubdomain(hostname);

  // Fallback for localhost development - check query param or default
  if (!subdomain) {
    const url = new URL(request.url);
    subdomain = url.searchParams.get('tenant') || 'josh'; // Default to josh in dev
  }

  // Clone the request headers and add subdomain
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-subdomain', subdomain);

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Return response with tenant header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
