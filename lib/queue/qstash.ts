import { Client } from "@upstash/qstash";

/**
 * NexusFlow — Background Job Queue via Upstash QStash
 *
 * WHY A JOB QUEUE?
 * ─────────────────
 * Serverless functions (Vercel) have a 10-30s execution limit.
 * At 1M+ users, operations like:
 *   - Sending welcome emails (Resend API call)
 *   - Posting webhook notifications to integrations
 *   - Generating AI task suggestions after project creation
 *   - Rebuilding search index after bulk task updates
 * …CANNOT run synchronously inside the API route that triggered them.
 *
 * SOLUTION: QStash (Upstash's serverless message queue)
 *   1. API route calls `enqueueJob()` → returns immediately (< 50ms)
 *   2. QStash delivers an HTTP POST to your worker endpoint with retry logic
 *   3. Worker processes the job asynchronously (can take minutes)
 *
 * FORTUNE 500 EQUIVALENT: AWS SQS + Lambda, Google Cloud Tasks, Azure Service Bus
 * FREE TIER: Upstash QStash — 500 messages/day free, $1/100K messages after
 *
 * Retry policy: exponential backoff, up to 3 retries over 24 hours
 * Dead-letter: failed jobs visible in Upstash console
 */

const qstash = new Client({
    token: process.env.QSTASH_TOKEN!,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Job Type Registry ─────────────────────────────────────────────────────────

export type JobPayload =
    | { type: "send_welcome_email"; userId: string; email: string; name: string }
    | { type: "notify_task_assigned"; taskId: string; assigneeId: string; assignedById: string }
    | { type: "sync_task_embeddings"; projectId: string; taskIds: string[] }
    | { type: "send_weekly_digest"; organizationId: string }
    | { type: "deliver_webhook"; webhookUrl: string; event: string; payload: Record<string, unknown> };

// ─── Enqueue ───────────────────────────────────────────────────────────────────

/**
 * Enqueue a background job.
 *
 * @param job     The typed job payload
 * @param opts    Optional: delay (seconds), deduplication key
 */
export async function enqueueJob(
    job: JobPayload,
    opts: { delaySeconds?: number; dedupKey?: string } = {}
): Promise<void> {
    await qstash.publishJSON({
        url: `${APP_URL}/api/jobs/worker`,
        body: job,
        retries: 3,
        delay: opts.delaySeconds,
        // Dedup prevents double-sending (e.g., welcome email if user clicks twice)
        contentBasedDeduplication: !!opts.dedupKey,
    });
}

// ─── Convenience wrappers ──────────────────────────────────────────────────────

export const Jobs = {
    sendWelcomeEmail: (userId: string, email: string, name: string) =>
        enqueueJob(
            { type: "send_welcome_email", userId, email, name },
            { dedupKey: `welcome-${userId}` }
        ),

    notifyTaskAssigned: (taskId: string, assigneeId: string, assignedById: string) =>
        enqueueJob({ type: "notify_task_assigned", taskId, assigneeId, assignedById }),

    syncTaskEmbeddings: (projectId: string, taskIds: string[]) =>
        enqueueJob({ type: "sync_task_embeddings", projectId, taskIds }),

    sendWeeklyDigest: (organizationId: string) =>
        // Digest sends go out at 9am Monday — delay from when this is called
        enqueueJob({ type: "send_weekly_digest", organizationId }),

    deliverWebhook: (webhookUrl: string, event: string, payload: Record<string, unknown>) =>
        enqueueJob({ type: "deliver_webhook", webhookUrl, event, payload }),
};
