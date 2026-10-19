import OpenAI from "openai";

/**
 * Shared OpenAI client instance.
 * All AI routes import from here so we have a single configuration point.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
