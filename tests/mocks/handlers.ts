/**
 * NexusFlow — MSW v2 request handlers
 *
 * Intercepts tRPC, Supabase REST, GraphQL, and AI API calls during tests.
 * Skill: Mock Service Worker v2 (msw)
 */

import { http, HttpResponse, graphql } from "msw";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mock.supabase.co";

export const handlers = [
    // ── Supabase REST ──────────────────────────────────────────────────────────

    http.get(`${API}/rest/v1/organizations`, () => {
        return HttpResponse.json([
            { id: "org-1", name: "Test Org", slug: "test-org", owner_id: "user-1" },
        ]);
    }),

    http.get(`${API}/rest/v1/projects`, () => {
        return HttpResponse.json([
            {
                id: "proj-1",
                org_id: "org-1",
                name: "Website Redesign",
                status: "active",
                created_at: new Date().toISOString(),
            },
        ]);
    }),

    http.get(`${API}/rest/v1/tasks`, () => {
        return HttpResponse.json([
            {
                id: "task-1",
                project_id: "proj-1",
                title: "Set up repo",
                status: "done",
                priority: "medium",
                assignee_id: null,
                due_date: null,
                created_at: new Date().toISOString(),
            },
        ]);
    }),

    http.post(`${API}/rest/v1/tasks`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ id: "task-new", ...body }, { status: 201 });
    }),

    http.patch(`${API}/rest/v1/tasks`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(body);
    }),

    // ── tRPC (internal API routes) ─────────────────────────────────────────────

    http.post("/api/trpc/tasks.create", async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ result: { data: { id: "task-new", ...body } } });
    }),

    http.get("/api/trpc/tasks.list", () => {
        return HttpResponse.json({ result: { data: [] } });
    }),

    // ── GraphQL (graphql-yoga) ─────────────────────────────────────────────────

    graphql.query("GetProjects", () => {
        return HttpResponse.json({
            data: { projects: [{ id: "proj-1", name: "Website Redesign", status: "active" }] },
        });
    }),

    // ── OpenAI / Vercel AI SDK ─────────────────────────────────────────────────

    http.post("/api/ai/generate-tasks", () => {
        return HttpResponse.json({ tasks: [{ title: "Mock AI task", priority: "medium" }] });
    }),

    // ── PostHog ────────────────────────────────────────────────────────────────

    http.post("https://app.posthog.com/capture/", () => {
        return new HttpResponse(null, { status: 200 });
    }),
];
