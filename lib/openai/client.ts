import OpenAI from "openai";

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    if (!_openai) {
        const key = process.env.OPENAI_API_KEY;
        if (!key) throw new Error("OPENAI_API_KEY environment variable is not set");
        _openai = new OpenAI({ apiKey: key });
    }
    return _openai;
}
