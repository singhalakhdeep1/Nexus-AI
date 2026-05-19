// ─── Task Repository ──────────────────────────────────────────────────────────
// The repository is the ONLY place that knows about Supabase.
// Domain entities never import Supabase. Use cases never import Supabase.
// Only repositories do. This is the Clean Architecture dependency rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import { Task, type TaskRow, type CreateTaskInput, type UpdateTaskInput } from "@/lib/domain/entities/task.entity";
import { TaskStatus } from "@/lib/domain/value-objects/task-status";
import { NotFoundError } from "@/lib/domain/errors";

export interface TaskFilters {
    status?: string;
    assigneeId?: string;
    sprintId?: string;
    cursor?: number;
    limit?: number;
}

export interface PaginatedTasks {
    tasks: Task[];
    nextCursor: number | null;
    hasMore: boolean;
}

export class TaskRepository {
    constructor(private readonly db: SupabaseClient) { }

    // ── Queries ───────────────────────────────────────────────────────────────

    async findById(id: string): Promise<Task | null> {
        const { data, error } = await this.db
            .from("tasks")
            .select("id, project_id, title, description, status, priority, assignee_id, due_date, position, created_by, created_at, updated_at")
            .eq("id", id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return null;
        return Task.fromRow(data as TaskRow);
    }

    async findByIdOrThrow(id: string): Promise<Task> {
        const task = await this.findById(id);
        if (!task) throw new NotFoundError("Task");
        return task;
    }

    async findByProject(projectId: string, filters: TaskFilters = {}): Promise<PaginatedTasks> {
        const limit = Math.min(filters.limit ?? 50, 100);

        let query = this.db
            .from("tasks")
            .select("id, project_id, title, description, status, priority, assignee_id, due_date, position, created_by, created_at, updated_at")
            .eq("project_id", projectId)
            .order("position", { ascending: true })
            .limit(limit + 1);  // fetch one extra to detect next page

        if (filters.status) query = query.eq("status", filters.status);
        if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
        if (filters.cursor) query = query.gt("position", filters.cursor);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        const rows = (data ?? []) as TaskRow[];
        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;
        const tasks = items.map(row => Task.fromRow(row));

        return {
            tasks,
            hasMore,
            nextCursor: hasMore ? items[items.length - 1].position : null,
        };
    }

    async countByProject(projectId: string): Promise<Record<string, number>> {
        const { data, error } = await this.db
            .from("tasks")
            .select("status")
            .eq("project_id", projectId);

        if (error) throw new Error(error.message);

        return (data ?? []).reduce<Record<string, number>>((acc, row) => {
            acc[row.status] = (acc[row.status] ?? 0) + 1;
            return acc;
        }, {});
    }

    // ── Commands ──────────────────────────────────────────────────────────────

    async save(task: Task): Promise<void> {
        const row = task.toRow();
        const { error } = await this.db
            .from("tasks")
            .upsert({
                ...row,
                created_at: task.createdAt.toISOString(),
            });
        if (error) throw new Error(error.message);
    }

    async updateStatus(id: string, status: string, updatedAt: Date): Promise<void> {
        const { error } = await this.db
            .from("tasks")
            .update({ status, updated_at: updatedAt.toISOString() })
            .eq("id", id);
        if (error) throw new Error(error.message);
    }

    async updatePosition(id: string, position: number): Promise<void> {
        const { error } = await this.db
            .from("tasks")
            .update({ position, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw new Error(error.message);
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.db
            .from("tasks")
            .delete()
            .eq("id", id);
        if (error) throw new Error(error.message);
    }
}
