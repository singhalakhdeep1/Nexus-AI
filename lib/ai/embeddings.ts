import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

const embeddingModel = openai.embedding("text-embedding-3-small");

/**
 * Generate a 1536-dim embedding vector for a text string.
 * Used for:
 *   - Indexing task title + description on create/update
 *   - Query-time RAG retrieval in the AI assistant
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embeddingModel,
        value: text.slice(0, 8000), // token budget guard
    });
    return embedding;
}
