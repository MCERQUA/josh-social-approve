# JAM Social - Social Media Management Platform

## Project Overview

Multi-tenant social media content approval and scheduling platform built with Next.js 16.

**Live URL:** https://*.jamsocial.app (wildcard subdomains)
**GitHub:** https://github.com/MCERQUA/josh-social-approve
**Hosting:** Netlify (serverless)

---

## Client Profiles

When working on tasks for a specific client, ALWAYS review their CLIENT-PROFILE.md first.

| Client Code | Company | Subdomain | Profile Location |
|-------------|---------|-----------|------------------|
| ICA | Insulation Contractors of Arizona | icafoam.jamsocial.app | `social-approve-app/public/clients/ICA/CLIENT-PROFILE.md` |
| CCA | Contractor's Choice Agency | josh.jamsocial.app | `social-approve-app/public/clients/CCA/CLIENT-PROFILE.md` (TBD) |

### Client Folder Structure

Each client has organized assets in `/social-approve-app/public/clients/{CODE}/`:

```
/clients/{CODE}/
├── CLIENT-PROFILE.md      # Company info, brand guidelines, social strategy
├── screenshots/           # Website screenshots
├── social-posts/
│   ├── approved/          # Posts ready to schedule
│   └── scheduled/         # Posts already scheduled
├── Company-Images/        # Real photos from client (jobsites, crew, etc.)
└── logos/                 # Logo variations
```

---

## ICA - Insulation Contractors of Arizona

**Owner:** Chris Kuhn
**Subdomain:** icafoam.jamsocial.app
**OneUp Category ID:** 29153
**Full Profile:** `social-approve-app/public/clients/ICA/CLIENT-PROFILE.md`

### Quick Reference

- **Phone:** 623-241-1939
- **Website:** insulationcontractorsofarizona.com
- **Services:** Spray Foam, Blown-In, Removal, Duct Cleaning
- **Area:** Phoenix Metro (40+ zip codes)
- **Brand Colors:** Cyan (#00CED1), Black, White

### Social Post Style

ICA posts use a specific template design:
- Black background with cyan flowing waves
- Logo in upper left
- Real jobsite photo in curved frame (center)
- Service headline in cyan
- Contact info bar at bottom
- "FREE ESTIMATES" badge

**IMPORTANT:** AI cannot generate realistic spray foam/insulation images. ICA posts require:
1. Real photos from `/clients/ICA/Company-Images/` (38 images available)
2. Template overlay applied to real photos
3. OR clippable template areas for manual photo insertion in Photoshop

### Available Assets

- **Logo:** `Company-Images/Insulation_Contractors_Logo_V3.png` (2MB, high-res)
- **Real Photos:** 38 images in `Company-Images/` (crew, truck, jobsites, trade shows)
- **Approved Posts:** 11 posts in `social-posts/approved/` (reference for style)

---

## CCA - Contractor's Choice Agency

**Owner:** Josh Cotner
**Subdomain:** josh.jamsocial.app
**OneUp Category ID:** 156826
**Full Profile:** TBD - `social-approve-app/public/clients/CCA/CLIENT-PROFILE.md`

---

## OneUp Integration

| Category ID | Name | Client |
|-------------|------|--------|
| 156826 | contractors Choice | CCA (Josh) |
| 29153 | ICA - Insulation Contractors Of Arizona | ICA (Chris) |
| 158563 | Jam Social Media | - |
| 162377 | Foamology insulation | - |
| 162378 | Spray Foam Insurance | - |

**CRITICAL:** Each brand MUST use its correct oneup_category_id when scheduling posts.

---

## Social Media Image Guidelines

- **Resolution:** 1K (1024x1024) - NOT 2K or 4K
- **Format:** JPEG for photos, PNG only when transparency needed
- **Target Size:** Under 500KB (ideally 200-300KB)
- **Aspect Ratio:** 1:1 for most posts, 16:9 for landscape, 9:16 for stories

**Why:** Social platforms compress anyway, 4K costs 3x more, large images break OneUp scheduling.

---

## Image Generation Workflow

Since Netlify is serverless, images auto-commit to GitHub:

```
1. Generate via Gemini (1K resolution)
2. Compress with Sharp (JPEG 85%, max 1024px)
3. Auto-commit to GitHub
4. Netlify rebuilds (~2-5 min)
5. Verify image accessible
6. Ready for OneUp scheduling
```

---

## File Structure

```
JOSH-SOCIAL-APPROVE/                    # Git root - pushed to GitHub
├── CLAUDE.md                           # THIS FILE - project instructions
├── MULTI-TENANT-ARCHITECTURE.md        # Technical architecture docs
├── DEPLOYMENT-GUIDE.md                 # Deployment instructions
├── netlify.toml                        # Netlify configuration
├── migrations/                         # Database migration scripts
├── api-server/                         # VPS API server (NOT deployed to Netlify)
│   ├── server.js                       # Express server for filesystem access
│   └── package.json                    # Dependencies (express, cors)
└── social-approve-app/                 # Next.js application
    ├── app/                            # App routes and pages
    ├── lib/                            # Utilities (tenant, oneup, github)
    ├── components/                     # React components
    ├── public/
    │   ├── clients/                    # Client assets (per-client folders)
    │   └── images/                     # Generated post images
    └── middleware.ts                   # Subdomain detection
```

---

## VPS API Server (Josh-AI Content Integration)

Since Netlify is serverless and cannot access the VPS filesystem, a separate API server bridges the gap.

### Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Netlify Frontend   │────▶│   VPS API Server    │────▶│  Josh-AI Websites   │
│  (*.jamsocial.app)  │     │  (api.jamsocial.app)│     │  (/home/josh/...)   │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### VPS API Server Details

- **Location:** `/home/josh/Josh-AI/websites/JOSH-SOCIAL-APPROVE/api-server/`
- **Port:** 6350
- **PM2 Process:** `jam-social-api`
- **Public URL:** `http://api.jamsocial.app`
- **Nginx Config:** `/etc/nginx/sites-available/jam-social-api`

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check - returns `{status: "ok"}` |
| `GET /api/website-content/:domainFolder` | Returns topical map, article queue, and stats for a website |
| `GET /api/websites/available` | Lists all Josh-AI website folders with AI content |
| `GET /api/proxy/josh-ai/*` | Proxy to Josh-AI API (localhost:6345) |

### Domain Folder Mapping

The `domain_folder` field in the websites table maps customer websites to Josh-AI folders:

| Customer Domain | Josh-AI Folder |
|-----------------|----------------|
| contractorschoiceagency.com | CCA |
| insulationcontractorsofarizona.com | foamologyinsulation-web |
| foamologyinsulation.com | foamologyinsulation-web |
| humblehelproofing.com | humble-help-roofing |

### Managing the VPS API

```bash
# Check status
pm2 status jam-social-api

# View logs
pm2 logs jam-social-api

# Restart
pm2 restart jam-social-api

# Test health
curl http://api.jamsocial.app/health
```

### Content Integration Flow

1. Customer adds website in dashboard with `domain_folder` selected
2. Frontend calls `/api/websites/{id}/content`
3. Next.js API route fetches from VPS API: `http://api.jamsocial.app/api/website-content/{folder}`
4. VPS API reads topical map from: `/home/josh/Josh-AI/websites/{folder}/ai/knowledge/04-content-strategy/ready/topical-map.json`
5. Returns parsed content to frontend

### Key Files

| File | Purpose |
|------|---------|
| `api-server/server.js` | VPS Express server |
| `social-approve-app/app/api/websites/[id]/content/route.ts` | Calls VPS API for content |
| `social-approve-app/app/api/websites/available-folders/route.ts` | Lists available Josh-AI folders |
| `social-approve-app/app/websites/[id]/page.tsx` | Website detail page with content tabs |

---

## Development Commands

```bash
cd /home/josh/Josh-AI/websites/JOSH-SOCIAL-APPROVE/social-approve-app

# Development
npm run dev

# Build
npm run build

# Database migrations
node ../run-migration.js
```

---

## Rules

1. **Never publish directly to OneUp** - Only schedule, let Josh click publish
2. **Always use correct category_id** - Each brand has its own OneUp category
3. **Check client profile first** - Before creating posts for any client
4. **Use real photos for ICA** - AI can't generate good insulation imagery
5. **1K resolution for social images** - Never 2K or 4K
6. **Compress images** - Target under 500KB

---

*Last Updated: December 20, 2025*
