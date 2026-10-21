import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { text, type } = body;

        const systemPrompts = {
            'task-generation': `You are a project management assistant. Parse natural language into structured tasks.
            Extract: title, description, priority (low/medium/high), deadline (if mentioned), assignee (if mentioned), labels.
            Respond in JSON format:
            {
              "tasks": [
                {
                  "title": "...",
                  "description": "...",
                  "priority": "medium",
                  "deadline": null,
                  "assignee": null,
                  "labels": ["tag1", "tag2"]
                }
              ]
            }`,
            'entity-extraction': `Extract entities from the text: deadlines, priorities, assignees, dependencies.
            Respond in JSON format:
            {
              "deadlines": [],
              "priorities": [],
              "assignees": [],
              "dependencies": []
            }`,
            'text-classification': `Classify the task into categories: development, design, marketing, operations, research.
            Respond with a single category name.`,
            'smart-search': `Generate search keywords from natural language query.
            Respond in JSON format:
            {
              "keywords": ["keyword1", "keyword2"],
              "filters": {
                "priority": null,
                "assignee": null,
                "status": null
              }
            }`
        };

        const systemPrompt = systemPrompts[type as keyof typeof systemPrompts] || systemPrompts['task-generation'];

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text },
            ],
            max_tokens: 1000,
            temperature: 0.3,
            response_format: type === 'text-classification' ? undefined : { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from OpenAI");

        let result;
        if (type === 'text-classification') {
            result = { category: content.trim() };
        } else {
            result = JSON.parse(content);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("NLP error:", error);
        return NextResponse.json({ error: "Failed to process NLP request" }, { status: 500 });
    }
}

