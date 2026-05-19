import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const bodySchema = z.object({
    type: z.enum(["task", "project", "sprint"]),
    id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { type, id } = parsed.data;

    let content = "";
    if (type === "task") {
        const { data } = await supabase
            .from("tasks")
            .select("title, description, status, priority, comments(body)")
            .eq("id", id)
            .single();
        if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
        content = `Task: ${data.title}\nStatus: ${data.status}\nPriority: ${data.priority}\nDescription: ${data.description || "None"}\nComments: ${data.comments?.map((c: any) => c.body).join("; ") || "None"}`;
    } else if (type === "project") {
        const { data } = await supabase
            .from("projects")
            .select("name, description, status, tasks(title, status, priority)")
            .eq("id", id)
            .single();
        if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const taskSummary = data.tasks?.slice(0, 20).map((t: any) => `${t.title} (${t.status})`).join(", ");
        content = `Project: ${data.name}\nDescription: ${data.description || "None"}\nStatus: ${data.status}\nRecent tasks: ${taskSummary}`;
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a project management assistant. Provide a concise, insightful summary in 2-3 sentences. Highlight key points, blockers, or progress.",
            },
            { role: "user", content: `Summarize this ${type}: ${content}` },
        ],
        max_tokens: 200,
        temperature: 0.5,
    });

    return NextResponse.json({ summary: completion.choices[0].message.content });
}
