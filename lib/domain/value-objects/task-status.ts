// ─── TaskStatus Value Object ──────────────────────────────────────────────────
// A value object is immutable and has no identity — only its value matters.
// Business rules about status transitions live here, not in components or routes.

import { ValidationError } from "@/lib/domain/errors";

export type TaskStatusValue = "todo" | "in_progress" | "in_review" | "done";

// Valid state machine transitions:
//   todo        → in_progress
//   in_progress → in_review  | todo
//   in_review   → done       | in_progress
//   done        → in_progress (reopen — not back to todo directly)
const ALLOWED_TRANSITIONS: Record<TaskStatusValue, TaskStatusValue[]> = {
    todo: ["in_progress"],
    in_progress: ["in_review", "todo"],
    in_review: ["done", "in_progress"],
    done: ["in_progress"],
};

export class TaskStatus {
    private constructor(readonly value: TaskStatusValue) { }

    static of(value: string): TaskStatus {
        const valid: TaskStatusValue[] = ["todo", "in_progress", "in_review", "done"];
        if (!valid.includes(value as TaskStatusValue)) {
            throw new ValidationError(`Invalid task status: "${value}"`);
        }
        return new TaskStatus(value as TaskStatusValue);
    }

    static todo() { return new TaskStatus("todo"); }
    static inProgress() { return new TaskStatus("in_progress"); }
    static inReview() { return new TaskStatus("in_review"); }
    static done() { return new TaskStatus("done"); }

    canTransitionTo(next: TaskStatus): boolean {
        return ALLOWED_TRANSITIONS[this.value].includes(next.value);
    }

    equals(other: TaskStatus): boolean {
        return this.value === other.value;
    }

    toString() { return this.value; }
}
