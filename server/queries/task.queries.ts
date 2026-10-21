// ─── Task Queries (CQRS Read Side) ───────────────────────────────────────────
// Queries are SEPARATE from commands. They can:
//   - Use a different data source (read replica, cache, vector DB)
//   - Return denormalized view models optimized for the UI
//   - Bypass domain entities entirely (they return raw data)
//
// This is CQRS-lite: reads don't go through domain entities,
// writes always go through use cases + entities.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface TaskViewModel {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: string | null;
    position: number;
    isOverdue: boolean;
    createdAt: string;
    // Joined denormalized fields (optimized for UI rendering)
    assignee?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface TaskListQuery {
    projectId: string;
    status?: string;
    assigneeId?: string;
    cursor?: number;
    limit?: number;
}

export interface TaskListResult {
    tasks: TaskViewModel[];
    nextCursor: number | null;
    hasMore: boolean;
    counts: Record<string, number>;
}

export class TaskQueries {
    constructor(private readonly db: SupabaseClient<any>) { }

    async list(query: TaskListQuery): Promise<TaskListResult> {
        const limit = Math.min(query.limit ?? 50, 100);

        let q = this.db
            .from("tasks")
            .select(`
                id, project_id, title, description, status, priority,
                assignee_id, due_date, position, created_at,
                assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
            `)
            .eq("project_id", query.projectId)
            .order("position", { ascending: true })
            .limit(limit + 1);

        if (query.status) q = q.eq("status", query.status);
        if (query.assigneeId) q = q.eq("assignee_id", query.assigneeId);
        if (query.cursor) q = q.gt("position", query.cursor);

        const [tasksResult, countsResult] = await Promise.all([
            q,
            this.db
                .from("tasks")
                .select("status")
                .eq("project_id", query.projectId),
        ]);

        if (tasksResult.error) throw new Error(tasksResult.error.message);

        const rows = (tasksResult.data ?? []) as any[];
        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;
        const now = new Date();

        const tasks: TaskViewModel[] = items.map(row => ({
            id: row.id,
            projectId: row.project_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assigneeId: row.assignee_id,
            dueDate: row.due_date,
            position: row.position,
            createdAt: row.created_at,
            isOverdue: !!row.due_date && new Date(row.due_date) < now && row.status !== "done",
            assignee: row.assignee ?? undefined,
        }));

        const counts = ((countsResult.data ?? []) as any[]).reduce<Record<string, number>>(
            (acc, row) => { acc[row.status] = (acc[row.status] ?? 0) + 1; return acc; },
            {}
        );

        return {
            tasks,
            hasMore,
            counts,
            nextCursor: hasMore ? items[items.length - 1].position : null,
        };
    }

    async getById(id: string): Promise<TaskViewModel | null> {
        const { data, error } = await this.db
            .from("tasks")
            .select(`
                id, project_id, title, description, status, priority,
                assignee_id, due_date, position, created_at,
                assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
            `)
            .eq("id", id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return null;

        const row = data as any;
        return {
            id: row.id,
            projectId: row.project_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assigneeId: row.assignee_id,
            dueDate: row.due_date,
            position: row.position,
            createdAt: row.created_at,
            isOverdue: !!row.due_date && new Date(row.due_date) < new Date() && row.status !== "done",
            assignee: row.assignee ?? undefined,
        };
    }

    // ── Analytics queries (pure read — no domain entities needed) ─────────────

    async getProjectAnalytics(projectId: string) {
        const { data, error } = await this.db
            .from("tasks")
            .select("status, priority, due_date, assignee_id")
            .eq("project_id", projectId);

        if (error) throw new Error(error.message);
        const rows = (data ?? []) as any[];
        const now = new Date();

        const totalTasks = rows.length;
        const completedTasks = rows.filter(r => r.status === "done").length;
        const overdueCount = rows.filter(r => r.due_date && new Date(r.due_date) < now && r.status !== "done").length;
        const urgentCount = rows.filter(r => r.priority === "urgent").length;

        const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
            acc[r.status] = (acc[r.status] ?? 0) + 1;
            return acc;
        }, {});

        const byPriority = rows.reduce<Record<string, number>>((acc, r) => {
            acc[r.priority] = (acc[r.priority] ?? 0) + 1;
            return acc;
        }, {});

        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
            overdueCount,
            urgentCount,
            byStatus,
            byPriority,
        };
    }
}
