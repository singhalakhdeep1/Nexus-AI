import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle ORM database client.
 *
 * Uses `postgres` (not Supabase JS) for direct, type-safe SQL queries.
 * Supabase client is still used for Auth, Realtime, and Storage.
 *
 * Connection pooling: in production, point DATABASE_URL at Supabase's
 * PgBouncer endpoint (port 6543, mode=transaction) for serverless-safe pooling.
 *
 * EXPLAIN ANALYZE example (run in db:studio or migrations):
 *   EXPLAIN ANALYZE SELECT * FROM tasks WHERE project_id = $1 AND status = $2 ORDER BY position;
 *   → ensures "tasks_project_status_idx" is used (Bitmap Heap Scan, ~0.05ms at 100k rows)
 */

const connectionString = process.env.DATABASE_URL!;

// For serverless (Edge / Vercel Functions): use HTTP mode
const client = postgres(connectionString, {
    prepare: false, // required for PgBouncer transaction mode
    max: 1, // serverless: single connection per cold start
});

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === "development" });

export type DB = typeof db;
