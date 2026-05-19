import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt, projectContext } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
        return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert project manager. Generate actionable tasks for software projects.
Project context: ${projectContext || "Software development project"}
Output JSON array of tasks with: title (string), description (string), priority ("low"|"medium"|"high"|"urgent"), status ("backlog"|"todo").
Return 3-8 tasks. No markdown, only valid JSON array.`,
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return NextResponse.json({ tasks: [] });

        const parsed = JSON.parse(content);
        const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks ?? []);

        return NextResponse.json({ tasks });
    } catch (err) {
        console.error("AI generation error:", err);
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }
}
