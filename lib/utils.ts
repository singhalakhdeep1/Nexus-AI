import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { TaskPriority, TaskStatus } from "@/types";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ============================================================
// Date utilities
// ============================================================

export function formatDate(date: string | Date): string {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d, yyyy");
}

export function formatRelativeTime(date: string | Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatShortDate(date: string | Date): string {
    return format(new Date(date), "MMM d");
}

// ============================================================
// Task priority utilities
// ============================================================

export const PRIORITY_CONFIG: Record<
    TaskPriority,
    { label: string; color: string; bgColor: string; icon: string }
> = {
    no_priority: { label: "No Priority", color: "text-muted-foreground", bgColor: "bg-muted", icon: "minus" },
    urgent: { label: "Urgent", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950", icon: "alert-circle" },
    high: { label: "High", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950", icon: "arrow-up" },
    medium: { label: "Medium", color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-950", icon: "minus" },
    low: { label: "Low", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950", icon: "arrow-down" },
};

// ============================================================
// Task status utilities
// ============================================================

export const STATUS_CONFIG: Record<
    TaskStatus,
    { label: string; color: string; bgColor: string; borderColor: string }
> = {
    backlog: { label: "Backlog", color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800", borderColor: "border-slate-400" },
    todo: { label: "Todo", color: "text-foreground", bgColor: "bg-white dark:bg-slate-900", borderColor: "border-slate-400" },
    in_progress: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", borderColor: "border-blue-400" },
    in_review: { label: "In Review", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950", borderColor: "border-purple-400" },
    done: { label: "Done", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950", borderColor: "border-green-400" },
    cancelled: { label: "Cancelled", color: "text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-900", borderColor: "border-slate-300" },
};

// ============================================================
// String utilities
// ============================================================

export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "…";
}

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function generateIdentifier(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4);
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// ============================================================
// Number utilities
// ============================================================

export function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ============================================================
// Color utilities
// ============================================================

export function hexToHsl(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generate avatar color from string (deterministic)
export function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
        "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
    ];
    return colors[Math.abs(hash) % colors.length];
}
