import { createClient as createLiveblocksClient } from "@liveblocks/core";

/**
 * Liveblocks client configuration for NexusFlow.
 *
 * Storage shape mirrors the Kanban board state:
 *   - tasks: LiveMap<taskId, TaskData>
 *   - columns: LiveList<ColumnOrder>
 *
 * Presence: real-time cursor position + selected card ID per user.
 */

export type UserPresence = {
    cursor: { x: number; y: number } | null;
    selectedTaskId: string | null;
    name: string;
    avatar: string;
    color: string;
};

export type TaskStorage = {
    id: string;
    title: string;
    status: "todo" | "in_progress" | "in_review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    position: number;
    assigneeId: string | null;
};

declare global {
    interface Liveblocks {
        Presence: UserPresence;
        Storage: {
            taskOrder: Record<string, string[]>; // status -> taskId[]
        };
        UserMeta: {
            id: string;
            info: {
                name: string;
                avatar: string;
                color: string;
            };
        };
        RoomEvent:
        | { type: "TASK_MOVED"; taskId: string; fromStatus: string; toStatus: string }
        | { type: "TASK_CREATED"; taskId: string }
        | { type: "TASK_DELETED"; taskId: string };
    }
}
