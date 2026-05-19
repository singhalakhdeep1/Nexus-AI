import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { query: string; orgId: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { query, orgId } = body;
    if (!query || !orgId) return NextResponse.json({ error: "query and orgId required" }, { status: 400 });

    // Generate embedding
    const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const embedding = embeddingRes.data[0].embedding;

    // pgvector similarity search
    const { data: results, error } = await supabase.rpc("search_tasks", {
        query_embedding: embedding,
        match_org_id: orgId,
        match_threshold: 0.7,
        match_count: 10,
    });

    if (error) {
        // Fallback to full-text search if pgvector not set up
        const { data: ftResults } = await supabase
            .from("tasks")
            .select("id, title, identifier, status, priority, project_id")
            .eq("org_id", orgId)
            .textSearch("fts", query, { type: "websearch" })
            .limit(10);
        return NextResponse.json({ results: ftResults ?? [], source: "fts" });
    }

    return NextResponse.json({ results: results ?? [], source: "vector" });
}
