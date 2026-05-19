"use client";

import { useState, useCallback } from "react";
import {
    DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
    PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, LayoutList, Kanban, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { useRealtimeTasks } from "@/lib/hooks/use-realtime";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { useUIStore } from "@/lib/stores/use-ui-store";
import type { Task, TaskStatus } from "@/types";
import Link from "next/link";

interface ProjectBoardProps {
    project: any;
    initialTasks: any[];
    members: any[];
    labels: any[];
    orgSlug: string;
}

export function ProjectBoard({ project, initialTasks, members, labels, orgSlug }: ProjectBoardProps) {
    const [tasks, setTasks] = useState<any[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<any | null>(null);
    const [view, setView] = useState<"board" | "list">("board");
    const { isCreateTaskOpen, openCreateTask, closeCreateTask, createTaskStatus } = useUIStore();
    const updateTask = useUpdateTask(project.id);

    // Real-time sync
    useRealtimeTasks(project.id);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const tasksByStatus = KANBAN_COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
        acc[col.id] = tasks.filter((t) => t.status === col.id);
        return acc;
    }, {});

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
    };

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        if (!over) return;
        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        // Check if over a column
        const isOverColumn = KANBAN_COLUMNS.some((c) => c.id === overId);
        if (isOverColumn && activeTask.status !== overId) {
            setTasks((prev) =>
                prev.map((t) => t.id === activeId ? { ...t, status: overId } : t)
            );
        }
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveTask(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        const task = tasks.find((t) => t.id === activeId);
        if (!task) return;

        const isOverColumn = KANBAN_COLUMNS.some((c) => c.id === overId);
        const targetStatus = isOverColumn ? overId : tasks.find((t) => t.id === overId)?.status;

        if (targetStatus && targetStatus !== task.status) {
            updateTask.mutate({ id: activeId, status: targetStatus as TaskStatus });
        }
    };

    const allMembers = members.map((m: any) => m.profiles).filter(Boolean);

    return (
        <div className="flex flex-col h-full">
            {/* Project Header */}
            <div className="border-b px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ backgroundColor: project.color || "#6366f1" }}
                    />
                    <div className="min-w-0">
                        <h1 className="font-semibold text-sm truncate">{project.name}</h1>
                        <p className="text-xs text-muted-foreground font-mono">{project.identifier}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs shrink-0">{project.status}</Badge>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex border rounded-md overflow-hidden">
                        <button
                            onClick={() => setView("board")}
                            className={`p-2 ${view === "board" ? "bg-muted" : "hover:bg-muted/50"}`}
                            title="Board view"
                        >
                            <Kanban className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={`p-2 ${view === "list" ? "bg-muted" : "hover:bg-muted/50"}`}
                            title="List view"
                        >
                            <LayoutList className="h-4 w-4" />
                        </button>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/org/${orgSlug}/projects/${project.id}/settings`}>
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>

                    <Button size="sm" onClick={() => openCreateTask(project.id, undefined)}>
                        <Plus className="h-4 w-4" /> Add Task
                    </Button>
                </div>
            </div>

            {/* Board */}
            {view === "board" && (
                <div className="flex-1 overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 p-6 h-full min-w-max">
                            {KANBAN_COLUMNS.map((col) => (
                                <KanbanColumn
                                    key={col.id}
                                    column={col}
                                    tasks={tasksByStatus[col.id] ?? []}
                                    onAddTask={() => openCreateTask(project.id, col.id as TaskStatus)}
                                    projectId={project.id}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeTask && <TaskCard task={activeTask} isDragging />}
                        </DragOverlay>
                    </DndContext>
                </div>
            )}

            {/* List view */}
            {view === "list" && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-1">
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} listMode />
                        ))}
                        {tasks.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground text-sm">
                                No tasks yet.{" "}
                                <button
                                    className="text-primary underline"
                                    onClick={() => openCreateTask(project.id, undefined)}
                                >
                                    Create one
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Task Dialog */}
            <CreateTaskDialog
                open={isCreateTaskOpen}
                onClose={closeCreateTask}
                projectId={project.id}
                defaultStatus={createTaskStatus}
                members={allMembers}
                labels={labels}
            />
        </div>
    );
}
