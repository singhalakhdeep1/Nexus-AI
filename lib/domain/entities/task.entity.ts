// ─── Task Entity ──────────────────────────────────────────────────────────────
// The Task entity is the heart of the domain. It:
//   1. Enforces all business rules (title, due date, status transitions)
//   2. Has NO knowledge of Supabase, Drizzle, tRPC, or Next.js
//   3. Is created via a static factory (Task.create) — never with `new` directly
//   4. Is rebuilt from DB rows via Task.fromRow
//
// This is the Clean Architecture dependency rule in action:
//   Domain layer depends on NOTHING. Everything depends on the domain.

import { TaskStatus } from "@/lib/domain/value-objects/task-status";
import { Priority } from "@/lib/domain/value-objects/priority";
import { ValidationError, DomainError } from "@/lib/domain/errors";

export interface TaskProps {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: Priority;
    assigneeId: string | null;
    dueDate: Date | null;
    position: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTaskInput {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: Date;
    position?: number;
    createdBy: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
}

// DB row shape coming from Drizzle / Supabase
export interface TaskRow {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee_id: string | null;
    due_date: string | null;
    position: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export class Task {
    private constructor(private readonly props: TaskProps) { }

    // ── Getters ───────────────────────────────────────────────────────────────
    get id() { return this.props.id; }
    get projectId() { return this.props.projectId; }
    get title() { return this.props.title; }
    get description() { return this.props.description; }
    get status() { return this.props.status; }
    get priority() { return this.props.priority; }
    get assigneeId() { return this.props.assigneeId; }
    get dueDate() { return this.props.dueDate; }
    get position() { return this.props.position; }
    get createdBy() { return this.props.createdBy; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    // ── Factory: create new task (enforces business rules) ────────────────────
    static create(input: CreateTaskInput): Task {
        // Business rule: title is required and cannot be empty
        if (!input.title?.trim()) {
            throw new ValidationError("Task title cannot be empty");
        }
        // Business rule: title cannot exceed 500 characters
        if (input.title.trim().length > 500) {
            throw new ValidationError("Task title cannot exceed 500 characters");
        }
        // Business rule: due date cannot be in the past
        if (input.dueDate && input.dueDate < new Date()) {
            throw new ValidationError("Due date cannot be in the past");
        }

        const now = new Date();
        return new Task({
            id: crypto.randomUUID(),
            projectId: input.projectId,
            title: input.title.trim(),
            description: input.description?.trim() ?? null,
            status: TaskStatus.todo(),
            priority: input.priority ? Priority.of(input.priority) : Priority.medium(),
            assigneeId: input.assigneeId ?? null,
            dueDate: input.dueDate ?? null,
            position: input.position ?? Date.now(),
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
        });
    }

    // ── Factory: rebuild from DB row ──────────────────────────────────────────
    static fromRow(row: TaskRow): Task {
        return new Task({
            id: row.id,
            projectId: row.project_id,
            title: row.title,
            description: row.description,
            status: TaskStatus.of(row.status),
            priority: Priority.of(row.priority),
            assigneeId: row.assignee_id,
            dueDate: row.due_date ? new Date(row.due_date) : null,
            position: row.position,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }

    // ── Behaviour: move to new status (enforces transition rules) ─────────────
    moveTo(newStatus: TaskStatus): Task {
        if (this.props.status.equals(newStatus)) return this; // no-op

        if (!this.props.status.canTransitionTo(newStatus)) {
            throw new DomainError(
                `Cannot move task from "${this.props.status}" to "${newStatus}" — invalid transition`
            );
        }

        return new Task({
            ...this.props,
            status: newStatus,
            updatedAt: new Date(),
        });
    }

    // ── Behaviour: update task fields ─────────────────────────────────────────
    update(input: UpdateTaskInput): Task {
        if (input.title !== undefined) {
            if (!input.title.trim()) throw new ValidationError("Task title cannot be empty");
            if (input.title.trim().length > 500) throw new ValidationError("Task title cannot exceed 500 characters");
        }
        if (input.dueDate && input.dueDate < new Date()) {
            throw new ValidationError("Due date cannot be in the past");
        }

        return new Task({
            ...this.props,
            title: input.title?.trim() ?? this.props.title,
            description: input.description !== undefined ? (input.description?.trim() ?? null) : this.props.description,
            priority: input.priority ? Priority.of(input.priority) : this.props.priority,
            assigneeId: input.assigneeId !== undefined ? input.assigneeId : this.props.assigneeId,
            dueDate: input.dueDate !== undefined ? input.dueDate : this.props.dueDate,
            updatedAt: new Date(),
        });
    }

    // ── Behaviour: reposition on the board ───────────────────────────────────
    reposition(position: number): Task {
        return new Task({ ...this.props, position, updatedAt: new Date() });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    isOverdue(): boolean {
        return !!this.props.dueDate
            && this.props.dueDate < new Date()
            && this.props.status.value !== "done";
    }

    isAssignedTo(userId: string): boolean {
        return this.props.assigneeId === userId;
    }

    // ── Serialise back to DB row ───────────────────────────────────────────────
    toRow(): Omit<TaskRow, "created_at" | "updated_at"> & { updated_at: string } {
        return {
            id: this.props.id,
            project_id: this.props.projectId,
            title: this.props.title,
            description: this.props.description,
            status: this.props.status.value,
            priority: this.props.priority.value,
            assignee_id: this.props.assigneeId,
            due_date: this.props.dueDate?.toISOString() ?? null,
            position: this.props.position,
            created_by: this.props.createdBy,
            updated_at: this.props.updatedAt.toISOString(),
        };
    }
}
