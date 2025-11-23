# Netlify Deployment Setup

## Environment Variables

Add these environment variables in Netlify:

**Site configuration → Environment variables → Add a variable**

### Required Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=<your-neon-database-url-from-.env.local>

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://accounts.jamsocial.app/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://accounts.jamsocial.app/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://josh.jamsocial.app/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://josh.jamsocial.app/onboarding
```

**Note:** Get the actual values from your local `.env.local` file (which is gitignored for security).

### How to Add

1. Go to your Netlify site dashboard
2. Click **Site configuration** in the left sidebar
3. Click **Environment variables**
4. Click **Add a variable**
5. For each variable above:
   - Key: Variable name (e.g., `DATABASE_URL`)
   - Value: The value from above
   - Click **Create variable**

## Domain Configuration

### Custom Domain Setup

1. Go to **Site configuration → Domain management**
2. Click **Add a domain**
3. Enter: `josh.jamsocial.app`
4. Follow Netlify's DNS configuration instructions

### DNS Records

Add these DNS records in your domain provider (GoDaddy, Cloudflare, etc.):

```
Type: CNAME
Name: josh
Value: <your-netlify-site>.netlify.app
```

## Build Settings

The repository already has `netlify.toml` configured:

```toml
[build]
  base = "social-approve-app"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

No additional build configuration needed.

## After Deployment

1. Visit `https://josh.jamsocial.app`
2. You should be redirected to Clerk sign-in: `https://accounts.jamsocial.app/sign-in`
3. Sign in with your Clerk account
4. You'll be redirected back to the dashboard

## Troubleshooting

### Build Fails with "Missing publishableKey"
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is added to Netlify environment variables
- Trigger a new deploy after adding variables

### Authentication Not Working
- Check that all Clerk environment variables are set correctly
- Verify Clerk dashboard has josh.jamsocial.app configured as allowed domain

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check Neon PostgreSQL database is running
- Ensure database connection string includes `?sslmode=require`

## Deployment Checklist

- [ ] Add all environment variables to Netlify
- [ ] Configure custom domain `josh.jamsocial.app`
- [ ] Verify DNS records are set
- [ ] Trigger new deploy
- [ ] Test sign in flow
- [ ] Test post approvals functionality
- [ ] Verify all pages load correctly
