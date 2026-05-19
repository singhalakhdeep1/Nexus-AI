import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./supabase/migrations/drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    // Verbose output: log every SQL statement during migration
    verbose: true,
    strict: true,
});
