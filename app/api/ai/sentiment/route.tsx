import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { text, context } = body;

        const systemPrompt = `You are a sentiment analysis assistant for project management.
        Analyze the sentiment of the text and classify it as:
        - positive: Expresses satisfaction, progress, success, or optimism
        - negative: Expresses frustration, blockers, delays, or pessimism
        - neutral: Factual statements without emotional content
        
        Also provide:
        - confidence: A number between 0 and 1
        - key_phrases: Important phrases that indicate the sentiment
        - suggested_action: What action should be taken based on this sentiment
        
        Respond in JSON format:
        {
          "sentiment": "positive|negative|neutral",
          "confidence": 0.95,
          "key_phrases": ["phrase1", "phrase2"],
          "suggested_action": "..."
        }`;

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Text: ${text}\nContext: ${context || "Task comment"}` },
            ],
            max_tokens: 500,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from OpenAI");

        const result = JSON.parse(content);

        // Store sentiment analysis in database
        if (context === 'comment') {
            await supabase.from('comment_sentiments').insert({
                user_id: user.id,
                text,
                ...result,
                analyzed_at: new Date().toISOString(),
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Sentiment analysis error:", error);
        return NextResponse.json({ error: "Failed to analyze sentiment" }, { status: 500 });
    }
}

