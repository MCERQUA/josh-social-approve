import { neon } from '@neondatabase/serverless';

// Lazy connection - only connects when actually used (not during build)
export const sql = neon(process.env.DATABASE_URL!);
