import { openai } from "@ai-sdk/openai";
import { generateEmbedding } from "./embeddings";
import { createClient } from "@/lib/supabase/server";

const MATCH_THRESHOLD = 0.75;
const MATCH_COUNT = 8;

/**
 * RAG pipeline for the "Ask your workspace" assistant.
 *
 * 1. Embed the user query with text-embedding-3-small.
 * 2. Run pgvector cosine similarity search against tasks + docs.
 * 3. Return ranked context chunks to be injected into the system prompt.
 */
export async function retrieveContext(query: string, projectId: string): Promise<string> {
    const supabase = await createClient();

    // 1. Embed query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Vector similarity search (pgvector HNSW index — sub-10ms at 500k rows)
    const { data: chunks } = await supabase.rpc("match_task_embeddings", {
        query_embedding: queryEmbedding,
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
        p_project_id: projectId,
    });

    if (!chunks?.length) return "";

    // 3. Format context for injection
    return chunks
        .map(
            (chunk: { title: string; description: string; status: string; similarity: number }) =>
                `Task: ${chunk.title}\nStatus: ${chunk.status}\n${chunk.description ?? ""}\n---`
        )
        .join("\n");
}
