"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Paperclip } from "lucide-react";
import { cn, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, stringToColor } from "@/lib/utils";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";

interface TaskCardProps {
    task: any;
    isDragging?: boolean;
    listMode?: boolean;
}

export function TaskCard({ task, isDragging, listMode }: TaskCardProps) {
    const labels = task.labels?.map((tl: any) => tl.labels).filter(Boolean) ?? [];

    if (listMode) {
        return (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-colors group cursor-pointer">
                <PriorityBadge priority={task.priority} compact />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{task.identifier}</p>
                </div>
                <StatusBadge status={task.status} />
                {task.assignee && (
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar_url} />
                        <AvatarFallback
                            className="text-[9px]"
                            style={{ backgroundColor: stringToColor(task.assignee.full_name) }}
                        >
                            {getInitials(task.assignee.full_name)}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "bg-background border rounded-xl p-3 space-y-2.5 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all",
                isDragging && "opacity-50 shadow-xl rotate-1"
            )}
        >
            {/* Priority + identifier */}
            <div className="flex items-center justify-between gap-1">
                <PriorityBadge priority={task.priority} compact />
                <span className="text-[10px] text-muted-foreground font-mono">{task.identifier}</span>
            </div>

            {/* Title */}
            <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>

            {/* Labels */}
            {labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {labels.slice(0, 3).map((label: any) => (
                        <span
                            key={label.id}
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                            style={{
                                backgroundColor: `${label.color}20`,
                                color: label.color,
                                borderColor: `${label.color}40`,
                            }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                    {task.comment_count > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                            <MessageSquare className="h-3 w-3" />
                            {task.comment_count}
                        </span>
                    )}
                    {task.attachment_count > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                            <Paperclip className="h-3 w-3" />
                            {task.attachment_count}
                        </span>
                    )}
                </div>
                {task.assignee && (
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={task.assignee.avatar_url} />
                        <AvatarFallback
                            className="text-[8px]"
                            style={{ backgroundColor: stringToColor(task.assignee.full_name || "") }}
                        >
                            {getInitials(task.assignee.full_name || "")}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
        </div>
    );
}

export function SortableTaskCard({ task }: { task: any }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} isDragging={isDragging} />
        </div>
    );
}
