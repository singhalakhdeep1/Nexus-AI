import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis/client";
import { retrieveContext } from "@/lib/ai/rag";
import { nexusflowTools } from "@/lib/ai/tools";
import { openAIBreaker } from "@/lib/resilience/circuit-breaker";

function getRatelimit() {
    return new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(30, "1m"),
        analytics: true,
    });
}

/**
 * AI assistant route — "Ask your workspace"
 *
 * Uses Vercel AI SDK v4:
 *   - streamText for token-by-token SSE streaming
 *   - tool calling: create_task, search_tasks, update_task_status
 *   - RAG: pgvector context injected into system prompt
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { success } = await getRatelimit().limit(user.id);
    if (!success) return new Response("Too many requests", { status: 429 });

    const { messages, projectId } = await req.json();
    if (!projectId) return new Response("projectId required", { status: 400 });

    // RAG: retrieve relevant task context for the last user message
    const lastUserMessage = messages.findLast((m: { role: string }) => m.role === "user");
    const context = lastUserMessage
        ? await retrieveContext(lastUserMessage.content, projectId)
        : "";

    const systemPrompt = `You are NexusFlow AI, an intelligent project management assistant.
You have access to real-time project data and can create tasks, search tasks, and update statuses.

WORKSPACE CONTEXT (most relevant tasks):
${context || "No matching tasks found."}

RULES:
- Be concise and action-oriented.
- When creating tasks, confirm with the user before executing unless they said "go ahead".
- Reference specific task titles from the context when relevant.
- Use tool calls for any create/update/search operations — never make up task IDs.
- Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

    return openAIBreaker.call(
        async () => {
            const result = streamText({
                model: openai("gpt-4o-mini"),
                system: systemPrompt,
                messages,
                tools: nexusflowTools,
                maxSteps: 5,
                temperature: 0.3,
            });
            return result.toDataStreamResponse();
        },
        () =>
            new Response(
                JSON.stringify({ error: "AI service is temporarily unavailable. Please try again shortly." }),
                { status: 503, headers: { "Content-Type": "application/json" } }
            )
    );
}
