"use client";

/**
 * React 19 hooks demo — NexusFlow task creation form.
 *
 * Demonstrates:
 *   - useOptimistic: instant UI update before server confirms
 *   - useFormStatus: pending state from parent <form> action
 *   - useTransition: non-urgent state update for filter UX
 *   - React 19 Server Actions with progressive enhancement
 */

import { useOptimistic, useTransition, startTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
    id: string;
    title: string;
    status: "todo" | "in_progress" | "done";
    optimistic?: boolean;
}

// ─── Submit Button (useFormStatus) ────────────────────────────────────────────

/**
 * useFormStatus reads the form's submission state from the nearest <form>
 * that has an `action` prop — no prop-drilling required.
 */
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-busy={pending}
        >
            {pending ? (
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding…
                </span>
            ) : (
                "Add Task"
            )}
        </button>
    );
}

// ─── Task List with useOptimistic ─────────────────────────────────────────────

interface TaskListProps {
    tasks: Task[];
    projectId: string;
}

export function OptimisticTaskList({ tasks, projectId }: TaskListProps) {
    /**
     * useOptimistic:
     *   - Takes current server state + an update function
     *   - Returns [optimisticState, addOptimistic]
     *   - optimisticState reverts automatically if the server action throws
     *   - No extra useEffect / rollback logic needed
     */
    const [optimisticTasks, addOptimisticTask] = useOptimistic(
        tasks,
        (currentTasks: Task[], newTitle: string) => [
            ...currentTasks,
            {
                id: `temp-${Date.now()}`,
                title: newTitle,
                status: "todo" as const,
                optimistic: true, // visual indicator
            },
        ]
    );

    /**
     * Server Action — runs on the server; handles DB insert.
     * The `use server` directive is inline to keep this file self-contained.
     * In production, move to `app/actions/tasks.ts`.
     */
    async function createTaskAction(formData: FormData) {
        "use server";
        const title = formData.get("title") as string;
        if (!title?.trim()) return;
        // import is deferred to avoid bundling server code client-side
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        await supabase.from("tasks").insert({ title, project_id: projectId, status: "todo" });
    }

    /**
     * Wrap the server action call to simultaneously trigger the optimistic update.
     * startTransition marks the update as non-urgent (React 19 concurrent feature).
     */
    function handleSubmit(formData: FormData) {
        const title = formData.get("title") as string;
        startTransition(() => {
            addOptimisticTask(title);
        });
        // The form's `action` prop fires createTaskAction; no manual call needed here
    }

    return (
        <div className="space-y-4">
            {/* Task list */}
            <ul className="space-y-2">
                {optimisticTasks.map((task) => (
                    <li
                        key={task.id}
                        className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${task.optimistic
                                ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 opacity-70"
                                : "border-border bg-card"
                            }`}
                    >
                        {task.optimistic && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                        )}
                        <span>{task.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground capitalize">{task.status}</span>
                    </li>
                ))}
            </ul>

            {/* Form with Server Action + useFormStatus */}
            <form action={createTaskAction} className="flex gap-2">
                <input
                    name="title"
                    placeholder="New task title…"
                    className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                />
                <SubmitButton />
            </form>
        </div>
    );
}

// ─── Filter with useTransition ────────────────────────────────────────────────

/**
 * useTransition: marks the filter state update as "non-urgent",
 * keeping the UI responsive while the list re-renders.
 * The `isPending` flag lets us show a loading indicator without suspense.
 */
export function TaskFilter({ onFilterChange }: { onFilterChange: (filter: string) => void }) {
    const [isPending, startFilterTransition] = useTransition();

    const filters = ["all", "todo", "in_progress", "done"] as const;

    return (
        <div className="flex items-center gap-2" role="group" aria-label="Filter tasks by status">
            {isPending && (
                <span className="text-xs text-muted-foreground animate-pulse">Filtering…</span>
            )}
            {filters.map((f) => (
                <button
                    key={f}
                    className="px-3 py-1 rounded-full text-xs font-medium border hover:bg-muted transition-colors"
                    onClick={() => {
                        startFilterTransition(() => {
                            onFilterChange(f);
                        });
                    }}
                >
                    {f.replace("_", " ")}
                </button>
            ))}
        </div>
    );
}
