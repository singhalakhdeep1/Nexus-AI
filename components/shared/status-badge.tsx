import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/utils";
import type { TaskStatus } from "@/types";

interface StatusBadgeProps {
    status: TaskStatus;
    compact?: boolean;
    className?: string;
}

export function StatusBadge({ status, compact: _compact, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    if (!config) return null;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap",
                config.bgColor,
                config.color,
                className
            )}
        >
            <config.icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}
