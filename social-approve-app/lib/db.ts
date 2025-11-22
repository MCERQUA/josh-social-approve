import { neon } from '@neondatabase/serverless';

// Use NETLIFY_DATABASE_URL (Neon integration creates this automatically)
// Lazy connection - only connects when actually used (not during build)
export const sql = neon(process.env.NETLIFY_DATABASE_URL!);
