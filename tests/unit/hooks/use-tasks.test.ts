import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock the supabase client for this test
const mockTasks = [
    { id: "1", title: "Task A", status: "todo", priority: "high", identifier: "PRJ-1", org_id: "org-1", project_id: "proj-1" },
    { id: "2", title: "Task B", status: "in_progress", priority: "medium", identifier: "PRJ-2", org_id: "org-1", project_id: "proj-1" },
];

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: mockTasks, error: null }),
                }),
            }),
        }),
        channel: () => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        }),
    }),
}));

import { useTasks } from "@/lib/hooks/use-tasks";

function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useTasks()", () => {
    it("returns tasks for a given project", async () => {
        const { result } = renderHook(() => useTasks("proj-1"), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toHaveLength(2);
        expect(result.current.data?.[0].title).toBe("Task A");
    });

    it("returns loading state initially", () => {
        const { result } = renderHook(() => useTasks("proj-1"), { wrapper: createWrapper() });
        expect(result.current.isLoading).toBe(true);
    });
});
