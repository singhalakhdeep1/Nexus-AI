"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
    id: string;
    title: string;
    identifier: string;
    status: string;
    priority: string;
    project_id: string;
    similarity?: number;
}

export function useSearch(orgId: string | null) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [debouncedQuery] = useDebounce(query, 300);

    const supabase = createClient();

    const performSearch = useCallback(async (q: string) => {
        if (!q.trim() || !orgId) { setResults([]); return; }

        setIsSearching(true);
        try {
            // Try semantic AI search first
            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q, orgId }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.results?.length) {
                    setResults(data.results);
                    return;
                }
            }

            // Fallback to full-text search
            const { data } = await supabase
                .from("tasks")
                .select("id, title, identifier, status, priority, project_id")
                .eq("org_id", orgId)
                .textSearch("title", q, { type: "websearch" })
                .limit(15);

            setResults(data ?? []);
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [orgId]);

    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery, performSearch]);

    return { query, setQuery, results, isSearching };
}
