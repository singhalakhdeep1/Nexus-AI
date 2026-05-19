/**
 * NexusFlow — Circuit Breaker for External API Calls
 *
 * WHY CIRCUIT BREAKERS?
 * ──────────────────────
 * At 1M users, if OpenAI goes down:
 *   WITHOUT circuit breaker: every AI request hangs for 30s → 10,000 concurrent
 *     connections pile up → database connection pool exhausted → entire app crashes.
 *
 *   WITH circuit breaker: after 5 failures, the breaker "opens" and immediately
 *     returns a fallback error for 60s. The database never gets starved.
 *
 * STATE MACHINE:
 *   CLOSED (normal) → failure threshold exceeded → OPEN (fail fast, 60s)
 *                                                         ↓ after 60s
 *                                              HALF-OPEN (trial one request)
 *                                                  ↓ success        ↓ failure
 *                                               CLOSED            OPEN again
 *
 * FORTUNE 500 EQUIVALENT:
 *   Netflix: Hystrix (Java), now resilience4j
 *   AWS: SDK has built-in retry + circuit breaking
 *   Stripe: all external calls wrapped in circuit breakers
 *   Shopify: every Storefront API call has a circuit breaker
 *
 * This is a lightweight in-process implementation.
 * For multi-instance deployments, store breaker state in Redis instead.
 */

type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
    /** Number of consecutive failures before opening the circuit */
    failureThreshold: number;
    /** Milliseconds to wait in OPEN state before trying again */
    recoveryTimeoutMs: number;
    /** Human-readable name (for logging/monitoring) */
    name: string;
}

export class CircuitBreaker {
    private state: BreakerState = "CLOSED";
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly opts: CircuitBreakerOptions;

    constructor(opts: CircuitBreakerOptions) {
        this.opts = opts;
    }

    async call<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
        if (this.state === "OPEN") {
            const elapsed = Date.now() - this.lastFailureTime;
            if (elapsed < this.opts.recoveryTimeoutMs) {
                // Still in recovery window — fail fast, don't even try
                console.warn(`[CircuitBreaker:${this.opts.name}] OPEN — returning fallback`);
                return fallback();
            }
            // Recovery window passed — try one request (HALF_OPEN)
            this.state = "HALF_OPEN";
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (err) {
            this.onFailure(err);
            return fallback();
        }
    }

    private onSuccess() {
        this.failureCount = 0;
        if (this.state === "HALF_OPEN") {
            console.info(`[CircuitBreaker:${this.opts.name}] HALF_OPEN → CLOSED (recovered)`);
        }
        this.state = "CLOSED";
    }

    private onFailure(err: unknown) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        console.error(
            `[CircuitBreaker:${this.opts.name}] failure ${this.failureCount}/${this.opts.failureThreshold}`,
            err instanceof Error ? err.message : err
        );

        if (
            this.state === "HALF_OPEN" ||
            this.failureCount >= this.opts.failureThreshold
        ) {
            this.state = "OPEN";
            console.error(
                `[CircuitBreaker:${this.opts.name}] OPEN — blocking for ${this.opts.recoveryTimeoutMs / 1000}s`
            );
        }
    }

    getState(): BreakerState {
        return this.state;
    }
}

// ─── Shared circuit breaker instances ─────────────────────────────────────────
// Module-level singletons: shared across all requests in the same serverless instance.
// In multi-instance deployments, move state to Redis for global coordination.

export const openAIBreaker = new CircuitBreaker({
    name: "OpenAI",
    failureThreshold: 5,
    recoveryTimeoutMs: 60_000, // 60 seconds
});

export const supabaseBreaker = new CircuitBreaker({
    name: "Supabase",
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
});
