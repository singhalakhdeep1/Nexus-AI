"use client";

import { FixedSizeList, type ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useRouter } from "next/navigation";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface VirtualTaskListProps {
    tasks: any[];
    orgSlug: string;
    projectId: string;
}

function Row({ index, style, data }: ListChildComponentProps) {
    const { tasks, onNavigate } = data as { tasks: any[]; onNavigate: (id: string) => void };
    const task = tasks[index];

    return (
        <div
            style={style}
            className="flex items-center gap-3 px-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onNavigate(task.id)}
        >
            <PriorityBadge priority={task.priority} iconOnly />
            <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">{task.identifier}</span>
            <span className="flex-1 text-sm font-medium truncate">{task.title}</span>
            <StatusBadge status={task.status} />
            {task.assignee && (
                <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignee.avatar_url} />
                    <AvatarFallback className="text-[8px]">{getInitials(task.assignee.full_name)}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}

export function VirtualTaskList({ tasks, orgSlug, projectId }: VirtualTaskListProps) {
    const router = useRouter();

    const onNavigate = (taskId: string) => {
        router.push(`/org/${orgSlug}/projects/${projectId}/tasks/${taskId}`);
    };

    if (tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No tasks found
            </div>
        );
    }

    return (
        <div style={{ height: "100%", minHeight: 400 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <FixedSizeList
                        height={height}
                        width={width}
                        itemCount={tasks.length}
                        itemSize={44}
                        itemData={{ tasks, onNavigate }}
                    >
                        {Row}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </div>
    );
}
