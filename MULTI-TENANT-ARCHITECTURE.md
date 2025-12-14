# JAM Social - Multi-Tenant Architecture

## Overview

JAM Social uses a single codebase with wildcard subdomain routing to serve multiple tenants (clients). Each tenant gets their own personalized subdomain (e.g., `josh.jamsocial.app`, `chris.jamsocial.app`) while sharing the same application infrastructure.

## Architecture Diagram

```
                    *.jamsocial.app
                          │
                          ▼
                 ┌────────────────┐
                 │   Netlify CDN   │
                 │  (Wildcard SSL) │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │   Middleware    │
                 │ (Extract tenant │
                 │  from subdomain)│
                 └────────┬───────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     ┌────────────────┐      ┌────────────────┐
     │ josh.jamsocial │      │chris.jamsocial │
     │   tenant: josh │      │  tenant: chris │
     └────────┬───────┘      └────────┬───────┘
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  Neon Database  │
                 │ (Tenant-isolated│
                 │      data)      │
                 └────────────────┘
```

## Database Schema

### Tenants Table
```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  subdomain VARCHAR(50) NOT NULL UNIQUE,  -- 'josh', 'chris'
  name VARCHAR(255) NOT NULL,              -- 'Josh Cotner'
  email VARCHAR(255),
  clerk_user_id VARCHAR(255),              -- Links to Clerk auth
  logo_url VARCHAR(500),
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Brands Table (Updated)
```sql
-- Added tenant_id for multi-tenant support
ALTER TABLE brands ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Each brand belongs to a tenant
-- Example: CCA belongs to Josh, ICA belongs to Chris
```

### Data Hierarchy
```
Tenant (subdomain)
└── Brands (websites/companies)
    └── Posts (social media content)
        └── Approvals (workflow state)
```

## Key Files

### Middleware (`middleware.ts`)
- Extracts subdomain from hostname
- Sets `x-tenant-subdomain` header for downstream use
- Handles localhost development (defaults to 'josh')
- Reserved subdomains: www, api, app, video, admin, staging, dev

### Tenant Library (`lib/tenant.ts`)
Server-side utilities:
- `getTenantSubdomain()` - Get current subdomain from headers
- `getTenant()` - Fetch full tenant record from DB
- `getTenantId()` - Get tenant ID for queries
- `getTenantBrands()` - Get all brands for current tenant
- `verifyBrandAccess()` - Check if brand belongs to tenant

### Tenant Context (`lib/tenant-context.tsx`)
Client-side React context:
- `TenantProvider` - Wraps app, fetches tenant data
- `useTenant()` - Hook to access tenant info and brands

### Tenant API (`app/api/tenant/route.ts`)
- `GET /api/tenant` - Returns current tenant and their brands

## How Tenant Detection Works

1. **Production** (`josh.jamsocial.app`):
   ```
   hostname: josh.jamsocial.app
   subdomain: josh
   ```

2. **Localhost Development**:
   ```
   hostname: localhost:3000
   subdomain: null → falls back to 'josh'

   # Or use query param:
   localhost:3000?tenant=chris
   ```

3. **Reserved Subdomains** (not treated as tenants):
   ```
   www.jamsocial.app → null (marketing site)
   api.jamsocial.app → null (API)
   video.jamsocial.app → null (video platform)
   ```

## Adding a New Tenant

### 1. Create Tenant Record
```sql
INSERT INTO tenants (subdomain, name, email, primary_color)
VALUES ('chris', 'Chris Smith', 'chris@example.com', '#10B981');
```

### 2. Create Their Brand(s)
```sql
-- Get tenant ID
SELECT id FROM tenants WHERE subdomain = 'chris';  -- e.g., 2

-- Create brand
INSERT INTO brands (tenant_id, slug, name, short_name, oneup_category_id, color, website_url)
VALUES (2, 'ica', 'Insulation Contractors of Arizona', 'ICA', 123456, 'green', 'https://insulationcontractorsaz.com');
```

### 3. Configure OneUp
- Log into OneUp
- Create a category for the new brand
- Connect their social accounts
- Note the category_id
- Update the brand record with `oneup_category_id`

### 4. DNS/Netlify (One-time Setup)
Wildcard subdomain handles all tenant subdomains automatically.

## Netlify Configuration

### Wildcard Domain Setup

1. **In Netlify Dashboard:**
   - Go to Site Settings → Domain Management
   - Add custom domain: `jamsocial.app`
   - Add domain alias: `*.jamsocial.app`

2. **DNS Configuration (at your registrar):**
   ```
   Type    Name    Value
   A       @       75.2.60.5 (Netlify IP)
   A       *       75.2.60.5 (Netlify IP)
   ```

3. **SSL Certificate:**
   - Netlify automatically provisions wildcard SSL for `*.jamsocial.app`

### Reserved Subdomains
Add explicit domain aliases for reserved subdomains that point to different sites:
- `video.jamsocial.app` → Video platform site
- `www.jamsocial.app` → Marketing site (or redirect to apex)

## Security Considerations

### Tenant Isolation
- All database queries filter by `tenant_id`
- API routes use `getTenantId()` to scope queries
- Brands are verified against current tenant before access

### Authentication
- Clerk handles authentication per subdomain
- Users are linked to tenants via `clerk_user_id`
- Future: Restrict users to only their tenant's subdomain

## Development Workflow

### Testing Different Tenants Locally
```bash
# Default (Josh)
http://localhost:3000

# Specify tenant via query param
http://localhost:3000?tenant=chris
http://localhost:3000?tenant=josh
```

### Running Migrations
```bash
# Create new tenant table
node run-tenants-migration.js

# Create new brand for tenant
node run-brands-migration.js
```

## Current Tenants

| Subdomain | Name | Brands |
|-----------|------|--------|
| josh | Josh Cotner | CCA (Contractor's Choice Agency) |

## Future Enhancements

1. **Admin Dashboard** - Manage tenants and brands
2. **Self-Service Onboarding** - Tenants create their own accounts
3. **Tenant-Specific Theming** - Custom colors/logos per tenant
4. **Usage Analytics** - Per-tenant metrics and billing
5. **Clerk Organization Support** - Link Clerk orgs to tenants
