import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { JobPayload } from "@/lib/queue/qstash";
import { getResend } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";

async function handler(req: NextRequest) {
    const job = (await req.json()) as JobPayload;

    switch (job.type) {
        case "send_welcome_email": {
            await getResend().emails.send({
                from: "NexusFlow <hello@nexusflow.app>",
                to: job.email,
                subject: "Welcome to NexusFlow",
                html: `
          <h1>Hi ${job.name}!</h1>
          <p>Your workspace is ready. Start by creating your first project.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open NexusFlow</a>
        `,
            });
            break;
        }

        case "notify_task_assigned": {
            const supabase = await createClient();
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
                await getResend().emails.send({
                    from: "NexusFlow <notifications@nexusflow.app>",
                    to: assignee.email,
                    subject: `Task assigned: ${task.title}`,
                    html: `<p>Hi ${assignee.full_name ?? "there"}, you've been assigned a new task: <strong>${task.title}</strong></p>`,
                });
            }
            break;
        }

        case "sync_task_embeddings": {
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
            await fetch(job.webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-NexusFlow-Event": job.event,
                    "X-NexusFlow-Timestamp": new Date().toISOString(),
                },
                body: JSON.stringify(job.payload),
                signal: AbortSignal.timeout(10_000),
            });
            break;
        }

        case "send_weekly_digest": {
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

// Lazily wrap so signing-key validation only runs at request time, not build time.
export async function POST(req: NextRequest) {
    if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
        return handler(req);
    }
    return verifySignatureAppRouter(handler)(req);
}
