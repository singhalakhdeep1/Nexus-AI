import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { JobPayload } from "@/lib/queue/qstash";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

/**
 * NexusFlow — Background Job Worker
 *
 * QStash calls this endpoint (HTTP POST) for every queued job.
 * The `verifySignatureAppRouter` wrapper validates the QSTASH_CURRENT_SIGNING_KEY
 * — rejecting any request not from Upstash QStash. This is critical security:
 * without it, anyone could POST to /api/jobs/worker and trigger emails, webhooks etc.
 *
 * Pattern: AWS Lambda triggered by SQS, Google Cloud Run triggered by Pub/Sub
 *
 * Retry behavior (configured in lib/queue/qstash.ts):
 *   Attempt 1: immediately
 *   Attempt 2: +1 minute (exponential backoff)
 *   Attempt 3: +4 minutes
 *   Dead-letter: logged to Sentry + visible in Upstash console
 */

const resend = new Resend(process.env.RESEND_API_KEY);

async function handler(req: NextRequest) {
    const job = (await req.json()) as JobPayload;

    switch (job.type) {
        case "send_welcome_email": {
            await resend.emails.send({
                from: "NexusFlow <hello@nexusflow.app>",
                to: job.email,
                subject: "Welcome to NexusFlow 🚀",
                html: `
          <h1>Hi ${job.name}!</h1>
          <p>Your workspace is ready. Start by creating your first project.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open NexusFlow →</a>
        `,
            });
            break;
        }

        case "notify_task_assigned": {
            const supabase = await createClient();
            // Fetch task + assignee info
            const { data: task } = await supabase
                .from("tasks")
                .select("title, projects(name)")
                .eq("id", job.taskId)
                .single();

            const { data: assignee } = await supabase
                .from("profiles")
                .select("email, full_name")
                .eq("id", job.assigneeId)
                .single();

            if (task && assignee?.email) {
                await resend.emails.send({
                    from: "NexusFlow <notifications@nexusflow.app>",
                    to: assignee.email,
                    subject: `Task assigned: ${task.title}`,
                    html: `<p>Hi ${assignee.full_name ?? "there"}, you've been assigned a new task: <strong>${task.title}</strong></p>`,
                });
            }
            break;
        }

        case "sync_task_embeddings": {
            // Re-generate pgvector embeddings for modified tasks (AI RAG stays fresh)
            const { generateEmbedding } = await import("@/lib/ai/embeddings");
            const supabase = await createClient();

            for (const taskId of job.taskIds) {
                const { data: task } = await supabase
                    .from("tasks")
                    .select("title, description")
                    .eq("id", taskId)
                    .single();

                if (task) {
                    const embedding = await generateEmbedding(`${task.title} ${task.description ?? ""}`);
                    await supabase
                        .from("tasks")
                        .update({ embedding_content: JSON.stringify(embedding) })
                        .eq("id", taskId);
                }
            }
            break;
        }

        case "deliver_webhook": {
            // Deliver webhook to external integration URL with retry (QStash handles retries)
            await fetch(job.webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-NexusFlow-Event": job.event,
                    "X-NexusFlow-Timestamp": new Date().toISOString(),
                },
                body: JSON.stringify(job.payload),
                signal: AbortSignal.timeout(10_000), // 10s timeout per delivery attempt
            });
            break;
        }

        case "send_weekly_digest": {
            // Weekly digest email logic would go here
            console.log(`[QStash] Weekly digest queued for org ${job.organizationId}`);
            break;
        }

        default: {
            const _exhaustive: never = job;
            return NextResponse.json({ error: "Unknown job type" }, { status: 400 });
        }
    }

    return NextResponse.json({ ok: true });
}

// verifySignatureAppRouter wraps the handler and returns 401 if the
// QSTASH_CURRENT_SIGNING_KEY doesn't match — prevents spoofed job delivery.
export const POST = verifySignatureAppRouter(handler);
