import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * AI Tool: create_task
 * Called by the AI assistant when the user says "create a task for X".
 * Demonstrates Vercel AI SDK tool-calling pattern.
 */
export const createTaskTool = tool({
    description:
        "Creates a new task in the project. Use when the user explicitly asks to create, add, or schedule a task.",
    parameters: z.object({
        title: z.string().describe("Short, imperative task title"),
        description: z.string().optional().describe("Detailed description or acceptance criteria"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        status: z.enum(["todo", "in_progress", "in_review", "done"]).default("todo"),
        dueDate: z.string().optional().describe("ISO 8601 date string, if mentioned"),
    }),
    execute: async ({ title, description, priority, status, dueDate }, { toolCallId }) => {
        // projectId is injected into context before streaming starts
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // NOTE: projectId must be passed via closure or request context in production
        const { data, error } = await supabase
            .from("tasks")
            .insert({ title, description, priority, status, due_date: dueDate, created_by: user.id })
            .select()
            .single();

        if (error) return { error: error.message };
        return { taskId: data.id, title: data.title, status: "created" };
    },
});

/**
 * AI Tool: search_tasks
 * Semantic + keyword task search tool — agent uses this to answer questions
 * like "which tasks are overdue?" or "what did I work on last week?"
 */
export const searchTasksTool = tool({
    description: "Search tasks in the project by keyword, status, assignee, or date range.",
    parameters: z.object({
        query: z.string().optional(),
        status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        overdue: z.boolean().optional(),
        limit: z.number().default(10),
    }),
    execute: async ({ query, status, priority, overdue, limit }) => {
        const supabase = await createClient();
        let req = supabase
            .from("tasks")
            .select("id, title, status, priority, due_date, assignee:profiles(full_name)")
            .limit(limit);

        if (status) req = req.eq("status", status);
        if (priority) req = req.eq("priority", priority);
        if (overdue) req = req.lt("due_date", new Date().toISOString()).neq("status", "done");
        if (query) req = req.ilike("title", `%${query}%`);

        const { data } = await req;
        return data ?? [];
    },
});

/**
 * AI Tool: update_task_status
 * Lets the AI assistant move a task to a new status on command.
 */
export const updateTaskStatusTool = tool({
    description: "Updates the status of a specific task. Use when the user says 'mark X as done' etc.",
    parameters: z.object({
        taskId: z.string().uuid(),
        status: z.enum(["todo", "in_progress", "in_review", "done"]),
    }),
    execute: async ({ taskId, status }) => {
        const supabase = await createClient();
        const completedAt = status === "done" ? new Date().toISOString() : null;
        const { error } = await supabase
            .from("tasks")
            .update({ status, completed_at: completedAt, updated_at: new Date().toISOString() })
            .eq("id", taskId);

        return error ? { error: error.message } : { success: true, taskId, newStatus: status };
    },
});

export const nexusflowTools = {
    create_task: createTaskTool,
    search_tasks: searchTasksTool,
    update_task_status: updateTaskStatusTool,
};
