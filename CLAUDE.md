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

*Last Updated: December 15, 2025*
