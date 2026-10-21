import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/utils";
import type { TaskPriority } from "@/types";

interface PriorityBadgeProps {
    priority: TaskPriority;
    compact?: boolean;
    iconOnly?: boolean;
    className?: string;
}

export function PriorityBadge({ priority, compact, iconOnly, className }: PriorityBadgeProps) {
    const config = PRIORITY_CONFIG[priority];
    if (!config) return null;

    if (compact || iconOnly) {
        return (
            <span
                className={cn("h-4 w-4 rounded-sm flex items-center justify-center text-xs shrink-0", config.bgColor, className)}
                title={config.label}
            >
                <config.icon className={cn("h-2.5 w-2.5", config.color)} />
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
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
