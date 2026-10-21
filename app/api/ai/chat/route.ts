import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { messages: { role: string; content: string }[]; projectContext?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { messages, projectContext } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const systemPrompt = `You are NexusAI, an intelligent project management assistant integrated into NexusFlow â€” a powerful SaaS PM tool. You help engineering teams manage tasks, plan sprints, write descriptions, and improve productivity.

${projectContext ? `Current project context: ${projectContext}` : ""}

You can:
- Break down features into actionable tasks
- Write clear task descriptions
- Suggest sprint plans and priorities
- Analyze blockers and risks
- Write acceptance criteria
- Generate standup summaries

Be concise, practical, and engineering-focused. Format responses with markdown when helpful.`;

    const stream = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        max_tokens: 1500,
        temperature: 0.7,
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(readableStream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

