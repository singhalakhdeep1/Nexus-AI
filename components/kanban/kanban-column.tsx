"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortableTaskCard } from "./task-card";
import { cn } from "@/lib/utils";

interface KanbanColumn {
    id: string;
    label: string;
    color?: string;
}

interface KanbanColumnProps {
    column: KanbanColumn;
    tasks: any[];
    onAddTask: () => void;
    projectId: string;
}

export function KanbanColumn({ column, tasks, onAddTask }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div className="flex flex-col w-72 shrink-0">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color || "#94a3b8" }} />
                    <span className="font-medium text-sm">{column.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-mono">
                        {tasks.length}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onAddTask}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Drop zone */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-xl bg-muted/40 border-2 border-dashed border-transparent transition-colors p-2 space-y-2 min-h-24",
                    isOver && "border-primary/40 bg-primary/5"
                )}
            >
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <button
                        onClick={onAddTask}
                        className="w-full py-6 flex flex-col items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors text-xs"
                    >
                        <Plus className="h-5 w-5" />
                        Add task
                    </button>
                )}
            </div>
        </div>
    );
}
