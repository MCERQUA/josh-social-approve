# Social Media Approval Dashboard

A professional Facebook-style social media post approval system for Contractor's Choice Agency.

## Quick Links

- [Project Summary](./PROJECT-SUMMARY.md) - Complete overview of features and architecture
- [Deployment Guide](./DEPLOYMENT-GUIDE.md) - Step-by-step deployment instructions
- [Quick Start](./QUICK-START.md) - Get started in minutes

## Features

- Facebook-style post approval interface
- Approve/reject workflow with detailed rejection reasons
- Smart filtering (All, Pending, Approved, Rejected)
- Real-time statistics dashboard
- 54 pre-loaded social media posts
- Responsive, professional design
- Neon PostgreSQL backend
- Ready for Netlify deployment

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Netlify

## Project Structure

```
JOSH-SOCIAL-APPROVE/
├── social-approve-app/       # Main Next.js application
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   ├── lib/                  # Database connection
│   ├── public/images/        # 54 post images
│   └── netlify.toml          # Netlify configuration
├── POSTS/                    # Original post images
├── database-schema.sql       # PostgreSQL schema
└── Documentation files
```

## Deployment to Netlify

### Prerequisites

1. GitHub account with this repository
2. Netlify account (free tier works)
3. Neon PostgreSQL database (free tier available)

### Steps

1. **Set up Neon Database**
   - Go to https://console.neon.tech
   - Create a new database or use existing
   - Run the SQL from `database-schema.sql` in the SQL Editor
   - Copy your connection string

2. **Deploy to Netlify**
   - Go to https://app.netlify.com/start
   - Click "Import from Git" → Select GitHub
   - Choose `josh-social-approve` repository
   - Configure settings:
     - **Base directory**: `social-approve-app`
     - **Build command**: `npm run build`
     - **Publish directory**: `.next`
   - Add environment variable:
     - **Key**: `DATABASE_URL`
     - **Value**: Your Neon connection string
   - Click "Deploy site"

3. **Wait for Deployment**
   - Netlify will install dependencies, build, and deploy
   - First deployment takes 2-3 minutes
   - You'll get a live URL like `https://your-site.netlify.app`

### Important Netlify Settings

The `netlify.toml` file is already configured with:
- Next.js plugin (`@netlify/plugin-nextjs`)
- Node.js 20
- Correct build command and publish directory

**No manual configuration needed** - just import from GitHub and add the `DATABASE_URL` environment variable.

## Local Development

```bash
cd social-approve-app
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Required environment variable in `.env.local` (local) and Netlify (production):

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Database Schema

Two tables:
- **posts**: Stores all social media posts (54 pre-seeded)
- **approvals**: Tracks approval/rejection status and reasons

See `database-schema.sql` for complete schema.

## Security

- Environment variables for database credentials
- HTTPS enabled automatically via Netlify
- Database uses SSL connections
- `.env.local` excluded from Git

## Support

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed troubleshooting and deployment instructions.

## License

Proprietary - Contractor's Choice Agency

---

**Built**: November 22, 2025
**Status**: Production-ready
**GitHub**: https://github.com/MCERQUA/josh-social-approve
