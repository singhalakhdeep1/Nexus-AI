import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { type, context, data } = body;

        const systemPrompts = {
            'task-assignment': `Recommend the best assignee for a task based on skills, workload, and availability.
            Consider: skill match, current workload, past performance, availability.
            Respond in JSON format:
            {
              "recommended_assignee_id": "...",
              "confidence": 0.9,
              "reasoning": "...",
              "alternatives": [
                {"user_id": "...", "confidence": 0.8, "reasoning": "..."}
              ]
            }`,
            'timeline-prediction': `Predict project completion date based on current progress, team velocity, and remaining work.
            Consider: completed tasks, team capacity, historical velocity, complexity.
            Respond in JSON format:
            {
              "predicted_completion_date": "2024-03-15",
              "confidence": 0.85,
              "factors": {
                "team_velocity": "...",
                "complexity": "...",
                "risks": ["risk1", "risk2"]
              },
              "milestones": [
                {"name": "...", "estimated_date": "..."}
              ]
            }`,
            'resource-allocation': `Suggest optimal resource allocation for project phases.
            Consider: skill requirements, team availability, budget constraints, timeline.
            Respond in JSON format:
            {
              "allocations": [
                {
                  "user_id": "...",
                  "percentage": 50,
                  "role": "...",
                  "reasoning": "..."
                }
              ],
              "gaps": ["skill_gap1"],
              "recommendations": ["hire_contractor_for_x"]
            }`,
            'risk-assessment': `Identify potential risks and suggest mitigation strategies.
            Consider: technical complexity, team size, timeline pressure, dependencies.
            Respond in JSON format:
            {
              "risks": [
                {
                  "type": "technical|resource|timeline",
                  "description": "...",
                  "probability": "high|medium|low",
                  "impact": "high|medium|low",
                  "mitigation": "..."
                }
              ],
              "overall_risk_score": 0.7
            }`,
            'sprint-planning': `Recommend sprint planning based on backlog and team capacity.
            Consider: story points, team velocity, dependencies, priorities.
            Respond in JSON format:
            {
              "sprint_duration": 2,
              "recommended_tasks": [
                {
                  "task_id": "...",
                  "priority": 1,
                  "estimated_points": 5,
                  "reasoning": "..."
                }
              ],
              "capacity_utilization": 0.85,
              "risks": ["risk1"]
            }`
        };

        const systemPrompt = systemPrompts[type as keyof typeof systemPrompts] || systemPrompts['task-assignment'];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Context: ${context}\nData: ${JSON.stringify(data)}` },
            ],
            max_tokens: 1500,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from OpenAI");

        const result = JSON.parse(content);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Recommendation error:", error);
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
}
