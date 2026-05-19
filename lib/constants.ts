import type { TaskStatus, TaskPriority } from "@/types";

export const APP_NAME = "NexusFlow";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const PLANS = {
    free: { name: "Free", maxMembers: 5, maxProjects: 3, price: 0 },
    pro: { name: "Pro", maxMembers: 50, maxProjects: 20, price: 12 },
    enterprise: { name: "Enterprise", maxMembers: 9999, maxProjects: 9999, price: 49 },
} as const;

export const TASK_STATUSES: TaskStatus[] = [
    "backlog", "todo", "in_progress", "in_review", "done", "cancelled",
];

export const TASK_PRIORITIES: TaskPriority[] = [
    "urgent", "high", "medium", "low", "no_priority",
];

export const PROJECT_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
    "#84cc16", "#f97316", "#14b8a6", "#a855f7",
];

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
    { id: "backlog", label: "Backlog" },
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "in_review", label: "In Review" },
    { id: "done", label: "Done" },
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_FILE_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
];
