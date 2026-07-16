import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { type, context, input } = body;

        const systemPrompts = {
            'task-description': `Generate a detailed task description based on the title.
            Include: objective, acceptance criteria, dependencies, estimated effort.
            Respond in JSON format:
            {
              "description": "...",
              "acceptance_criteria": ["criteria1", "criteria2"],
              "dependencies": [],
              "estimated_hours": 4
            }`,
            'subtasks': `Break down a parent task into actionable subtasks.
            Each subtask should have: title, description, estimated_hours.
            Respond in JSON format:
            {
              "subtasks": [
                {
                  "title": "...",
                  "description": "...",
                  "estimated_hours": 2
                }
              ]
            }`,
            'meeting-summary': `Generate a meeting summary from activity feed.
            Include: attendees, decisions made, action items, blockers.
            Respond in JSON format:
            {
              "summary": "...",
              "decisions": ["decision1"],
              "action_items": [{"task": "...", "assignee": "..."}],
              "blockers": ["blocker1"]
            }`,
            'documentation': `Generate project documentation from tasks and activities.
            Include: project overview, architecture, setup instructions, contribution guide.
            Respond in JSON format:
            {
              "overview": "...",
              "architecture": "...",
              "setup": "...",
              "contribution": "..."
            }`,
            'acceptance-criteria': `Generate acceptance criteria for a task.
            Respond in JSON format:
            {
              "criteria": [
                "Given [context], when [action], then [outcome]",
                "..."
              ]
            }`
        };

        const systemPrompt = systemPrompts[type as keyof typeof systemPrompts] || systemPrompts['task-description'];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Input: ${input}\nContext: ${context || ""}` },
            ],
            max_tokens: 1500,
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from OpenAI");

        const result = JSON.parse(content);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Content generation error:", error);
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}
