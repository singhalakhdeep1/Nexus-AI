import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRedis } from "@/lib/redis/client";

/**
 * Health check endpoint — used by:
 *   - Docker: HEALTHCHECK instruction
 *   - Kubernetes: readinessProbe + livenessProbe
 *   - Uptime monitors (BetterUptime, Checkly)
 *   - Load balancer health checks (Vercel / ALB)
 *
 * Returns 200 if all dependencies are healthy, 503 if any are degraded.
 * Response time target: < 500ms (database + redis round-trips)
 *
 * Pattern used by: Stripe, Linear, Vercel, GitHub, Shopify
 */

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    version: string;
    timestamp: string;
    uptime: number;
    checks: {
        database: CheckResult;
        redis: CheckResult;
    };
}

interface CheckResult {
    status: "ok" | "error";
    latencyMs: number;
    error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
        await db.execute(sql`SELECT 1`);
        return { status: "ok", latencyMs: Date.now() - start };
    } catch (err) {
        return {
            status: "error",
            latencyMs: Date.now() - start,
            error: err instanceof Error ? err.message : "Unknown DB error",
        };
    }
}

async function checkRedis(): Promise<CheckResult> {
    const start = Date.now();
    try {
        await getRedis().ping();
        return { status: "ok", latencyMs: Date.now() - start };
    } catch (err) {
        return {
            status: "error",
            latencyMs: Date.now() - start,
            error: err instanceof Error ? err.message : "Unknown Redis error",
        };
    }
}

export async function GET() {
    const [database, redis_check] = await Promise.all([
        checkDatabase(),
        checkRedis(),
    ]);

    const allOk = database.status === "ok" && redis_check.status === "ok";
    const anyError = database.status === "error" && redis_check.status === "error";

    const overallStatus: HealthStatus["status"] = anyError
        ? "unhealthy"
        : allOk
            ? "healthy"
            : "degraded";

    const body: HealthStatus = {
        status: overallStatus,
        version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database,
            redis: redis_check,
        },
    };

    // 200 = healthy/degraded (load balancer keeps routing traffic)
    // 503 = unhealthy (load balancer removes instance from pool)
    const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

    return NextResponse.json(body, {
        status: httpStatus,
        headers: {
            // Do NOT cache health checks
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}

// Kubernetes liveness probe (just checks the process is alive — no DB call)
export async function HEAD() {
    return new Response(null, { status: 200 });
}
