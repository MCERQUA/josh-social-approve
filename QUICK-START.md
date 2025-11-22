# 🚀 Quick Start Guide - 5 Minutes to Live

## Prerequisites
- [x] Neon database created
- [x] GitHub account
- [x] Netlify account (free)

## Step 1: Initialize Database (2 minutes)

### Via Neon Console
1. Open: https://console.neon.tech
2. Select your database
3. Click "SQL Editor"
4. Copy contents of `database-schema.sql`
5. Paste and click "Run"

✅ Done! Database ready.

## Step 2: Push to GitHub (1 minute)

### Option A: GitHub CLI (fastest)
```bash
cd social-approve-app
gh repo create josh-social-approve --public --source=. --push
```

### Option B: Manual
1. Create repo: https://github.com/new
2. Name: `josh-social-approve`
3. Run:
```bash
cd social-approve-app
git remote add origin https://github.com/YOUR_USERNAME/josh-social-approve.git
git push -u origin main
```

✅ Done! Code on GitHub.

## Step 3: Deploy to Netlify (2 minutes)

1. Go to: https://app.netlify.com/start
2. Click "Import from Git"
3. Select GitHub → Authorize
4. Choose `josh-social-approve` repo
5. Configure:
   - Base directory: `social-approve-app`
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_M1KCzjnGhgL5@ep-billowing-union-ahca6j30-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
7. Click "Deploy site"

✅ Done! Site is live!

## Step 4: Test Your Site (1 minute)

Netlify will give you a URL like: `https://something.netlify.app`

1. Open the URL
2. Check:
   - [ ] Posts load
   - [ ] Images display
   - [ ] Click "Approve" on a post
   - [ ] Click "Reject" → Enter reason
   - [ ] Try filters (Pending, Approved, Rejected)

✅ Working? You're done!

## 🎉 That's It!

Total time: ~5 minutes
Your approval dashboard is now live and ready to use!

## Next Steps

### Add Custom Domain (Optional)
1. Netlify Dashboard → Domain settings
2. Add custom domain
3. Follow DNS instructions

### Customize
- Update title in `app/layout.tsx`
- Change colors in components
- Add more features

---

**Need help?** See `DEPLOYMENT-GUIDE.md` for detailed troubleshooting.
