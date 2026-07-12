import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Singleton pattern — one client instance for the browser
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
    if (client) return client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://default-project.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "default-anon-key";

    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

    return client;
}
