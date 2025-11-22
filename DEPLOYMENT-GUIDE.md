# Social Media Approval System - Deployment Guide

## Quick Deployment Checklist

- [ ] Database initialized with schema
- [ ] Environment variables configured
- [ ] GitHub repository created
- [ ] Netlify connected to repository
- [ ] Application deployed and tested

## Step 1: Initialize Database

Since `psql` is not available on this system, you'll need to run the database schema manually.

### Option A: Using Neon Console (Recommended)

1. Go to [Neon Console](https://console.neon.tech)
2. Select your database
3. Open the SQL Editor
4. Copy and paste the contents of `database-schema.sql`
5. Click "Run" to execute the schema

### Option B: Using Local psql

If you have `psql` installed locally:

```bash
psql 'postgresql://neondb_owner:npg_M1KCzjnGhgL5@ep-billowing-union-ahca6j30-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' < database-schema.sql
```

### Option C: Using the REST API

```bash
curl -X POST \
  'https://ep-billowing-union-ahca6j30.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d @database-schema.sql
```

## Step 2: Test Locally

```bash
cd social-approve-app
npm run dev
```

Open http://localhost:3000 and verify:
- [ ] Posts load correctly
- [ ] Images display properly
- [ ] Approve button works
- [ ] Reject button opens modal
- [ ] Rejection requires a reason
- [ ] Stats update correctly
- [ ] Filters work (All, Pending, Approved, Rejected)

## Step 3: Initialize Git Repository

```bash
cd social-approve-app
git init
git add .
git commit -m "Initial commit: Social Media Approval Dashboard"
```

## Step 4: Create GitHub Repository

### Using GitHub CLI

```bash
gh repo create josh-social-approve --public --source=. --push
```

### Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `josh-social-approve`
3. Description: "Social media post approval dashboard for Contractor's Choice Agency"
4. Public or Private: Your choice
5. Click "Create repository"
6. Follow the instructions to push existing code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/josh-social-approve.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to Netlify

### Method 1: Netlify CLI (Fastest)

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
cd social-approve-app
netlify init

# Follow prompts:
# - Create & configure a new site
# - Connect to GitHub repository
# - Build command: npm run build
# - Publish directory: .next

# Deploy
netlify deploy --prod
```

### Method 2: Netlify Web Interface

1. Go to https://app.netlify.com/start
2. Click "Import from Git"
3. Choose GitHub
4. Authorize Netlify
5. Select your `josh-social-approve` repository
6. Configure build settings:
   - **Base directory**: `social-approve-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Framework**: Next.js
7. Add environment variables:
   - `DATABASE_URL`: Your Neon connection string
8. Click "Deploy site"

## Step 6: Configure Environment Variables in Netlify

1. Go to your site in Netlify dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Click "Add a variable"
4. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_M1KCzjnGhgL5@ep-billowing-union-ahca6j30-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
5. Click "Save"
6. Trigger a new deploy: "Deploys" → "Trigger deploy" → "Deploy site"

## Step 7: Verify Deployment

Once deployed, Netlify will provide a URL (e.g., `https://your-site.netlify.app`).

Visit the URL and verify:
- [ ] Site loads correctly
- [ ] All posts are visible
- [ ] Images load from Netlify CDN
- [ ] Database connections work
- [ ] Approve/reject functionality works
- [ ] Modal opens for rejections
- [ ] Stats are accurate

## Custom Domain (Optional)

### Add Custom Domain in Netlify

1. Go to "Domain settings" → "Add custom domain"
2. Enter your domain (e.g., `approve.contractorschoiceagency.com`)
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic via Let's Encrypt)

## Troubleshooting

### Build Fails

**Error**: "DATABASE_URL is not defined"
- **Solution**: Add environment variable in Netlify settings

**Error**: "Module not found"
- **Solution**: Check `package.json` dependencies, run `npm install`

**Error**: "Type errors"
- **Solution**: Run `npm run type-check` locally and fix issues

### Runtime Errors

**Error**: "Failed to fetch posts"
- **Solution**: Check DATABASE_URL is correct in Netlify
- **Solution**: Verify Neon database is active and accessible

**Error**: "Images not loading"
- **Solution**: Ensure images are in `public/images/` directory
- **Solution**: Check Next.js image configuration

**Error**: "API routes return 500"
- **Solution**: Check Netlify function logs
- **Solution**: Verify database schema is initialized

## Maintenance

### Adding New Posts

1. Add new image to `public/images/`
2. Insert data into Neon database `posts` table
3. Create approval record with 'pending' status
4. Redeploy or wait for auto-deploy

### Updating Content

1. Edit files locally
2. Commit changes: `git commit -am "Update message"`
3. Push to GitHub: `git push`
4. Netlify auto-deploys from main branch

### Database Backups

Neon provides automatic backups. To create manual backup:

1. Go to Neon Console
2. Select your database
3. Navigate to "Backups"
4. Click "Create backup"

## Security Considerations

- ✓ Database credentials stored in environment variables
- ✓ `.env.local` in `.gitignore` (not committed)
- ✓ HTTPS enabled via Netlify
- ✓ Database uses SSL connections
- ⚠ Consider adding authentication for production use
- ⚠ Consider rate limiting for API routes

## Performance Optimization

- ✓ Next.js automatic code splitting
- ✓ Image optimization via Next.js Image component
- ✓ Serverless database (Neon) for fast queries
- ✓ Static page generation where possible
- ✓ Netlify CDN for global distribution

## Support

For issues:
1. Check Netlify deploy logs
2. Check browser console for errors
3. Review Netlify function logs
4. Verify database connectivity

---

**Deployment Status**: Ready for deployment
**Last Updated**: 2025-11-22
**Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Neon PostgreSQL, Netlify
