# JAM Social Image Generation - Learnings & Improvements

## Session: December 19, 2025

### Problem Discovered
Foamology images were generating as plain stock photos with no branding, invisible logo (dark on dark), and no text overlays.

### Root Causes Identified

1. **Logo visibility issue**: Dark navy logo on dark backgrounds = invisible
   - Solution: Use WH-BK logo version (white background) for dark images
   - Location: `/clients/FOAMOLOGY/logos/foamology-logo-WH-BK.png`

2. **Prompt style mismatch**: Default prompts said "DO NOT include text" but we wanted text overlays
   - Solution: Detect advertisement-style configs and skip conflicting instructions

3. **Logo composite conflict**: For advertisement-style images, Gemini generates complete branded designs INCLUDING company name in bottom bar. Then Sharp composites logo ON TOP, ruining the design.
   - **TODO NEXT SESSION**: Disable logo composite for advertisement-style templates
   - Check: `if (isAdvertisementStyle) { skip logo composite }`

### Two Image Generation Approaches

#### Approach A: Stock Photo + Logo (CCA, ICA default)
- Generate clean AI scene (no text)
- Composite logo in corner via Sharp
- Good for: brands that want flexibility, real photos swapped in later

#### Approach B: Advertisement Template (Foamology)
- Generate complete marketing graphic WITH text overlays
- Gemini includes: headline, tagline, bottom bar with contact info
- NO logo composite needed (branding is in the design)
- Good for: consistent branded marketing materials

### Database Config for Advertisement Style

```javascript
// Set in brands.image_config (JSONB)
{
  "styleDescription": "Create a professional social media ADVERTISEMENT...
    DESIGN LAYOUT:
    - Navy blue gradient background...
    - Red accent borders...
    TEXT TO INCLUDE IN IMAGE:
    - Bottom bar text: \"COMPANY | PHONE | WEBSITE\"
    ...",
  "logoPath": null,  // OR path for fallback
  "disableLogoComposite": true  // TODO: implement this flag
}
```

### Code Changes Made

1. **brand-image-config.ts** - `buildImagePromptTemplate()`
   - Detects `DESIGN LAYOUT` or `TEXT TO INCLUDE` in styleDescription
   - Uses full styleDescription directly instead of wrapping with "DO NOT include text"

2. **brand-image-config.ts** - `buildPostImagePrompt()`
   - For advertisement style: generates headline from post title (4 words max, UPPERCASE)
   - Extracts tagline from first sentence of content
   - Passes to Gemini for complete ad generation

### TODO: Next Session Priority

**CRITICAL FIX NEEDED:**
In `app/api/images/generate/route.ts` around line 341-345:

```typescript
// Current code - ALWAYS composites logo:
if (brandConfig && brandConfig.logoPath) {
  finalBuffer = await compositeLogoOnImage(compressedBuffer, brandConfig, baseUrl);
}

// CHANGE TO - Skip for advertisement style:
const isAdvertisementStyle = brandConfig?.styleDescription?.includes('TEXT TO INCLUDE');
if (brandConfig && brandConfig.logoPath && !isAdvertisementStyle) {
  finalBuffer = await compositeLogoOnImage(compressedBuffer, brandConfig, baseUrl);
}
```

### Foamology Specific Config

```javascript
{
  "primaryColor": "#1B3A6D",     // Navy blue
  "secondaryColor": "#C41E3A",   // Red
  "backgroundColor": "#1B3A6D",
  "logoPath": "/clients/FOAMOLOGY/logos/foamology-logo-WH-BK.png",
  "logoPosition": "top-left",
  "industry": "spray foam insulation contractor in Alaska",
  "tagline": "Anchorage Insulation Experts",
  "phone": "(907) 310-3000",
  "website": "foamologyinsulation.com",
  "styleDescription": "Create a professional social media ADVERTISEMENT..."
}
```

### Files Modified This Session

- `social-approve-app/lib/brand-image-config.ts` - Prompt building logic
- `social-approve-app/app/social/[brand]/approvals/page.tsx` - Auto-verify on load
- `social-approve-app/app/social/[brand]/image-approvals/page.tsx` - Auto-verify on load
- Database: `brands.image_config` for Foamology

### Files Added This Session

- `/clients/FOAMOLOGY/logos/foamology-logo-WH-BK.png` (white bg version)
- `/clients/FOAMOLOGY/logos/foamology-logo-color.png`
- `/clients/FOAMOLOGY/social-posts/approved/foamology-ice-dam-prevention-optimized.jpg`
- `/clients/FOAMOLOGY/screenshots/homepage.png`
- `run-foamology-setup.js` - Tenant/brand database setup

### Database Fixes Applied

1. **post_index constraint**: Changed from global unique to `(brand_id, post_index)` composite unique
2. **Foamology tenant**: Fixed duplicate tenant issue (cleared clerk_user_id from auto-created tenant)
3. **Foamology brand config**: Set up image_config with advertisement style

### Key Insight

**The generated advertisement images from Gemini are now PERFECT - the only problem is the unnecessary logo composite being added on top.**

Fix the logo composite skip for advertisement-style and Foamology will be production-ready.
