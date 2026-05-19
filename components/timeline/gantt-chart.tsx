"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    addDays, subDays, startOfDay, differenceInDays, format, startOfWeek, addWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    backlog: "bg-slate-400",
    todo: "bg-slate-500",
    in_progress: "bg-blue-500",
    in_review: "bg-violet-500",
    done: "bg-emerald-500",
    cancelled: "bg-red-400",
};

const DAY_WIDTH = 36; // px per day
const VISIBLE_DAYS = 42; // 6 weeks

interface GanttChartProps {
    project: { id: string; name: string };
    tasks: any[];
    orgSlug: string;
}

export function GanttChart({ project, tasks, orgSlug }: GanttChartProps) {
    const router = useRouter();
    const [startDate, setStartDate] = useState(() => subDays(startOfDay(new Date()), 7));

    const endDate = addDays(startDate, VISIBLE_DAYS - 1);

    const days = useMemo(() => {
        return Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(startDate, i));
    }, [startDate]);

    const today = startOfDay(new Date());
    const todayOffset = differenceInDays(today, startDate);

    const navigate = (direction: "prev" | "next") => {
        setStartDate((d) => direction === "prev" ? subDays(d, 14) : addDays(d, 14));
    };

    const goToToday = () => setStartDate(subDays(startOfDay(new Date()), 7));

    // Week header labels
    const weekLabels = useMemo(() => {
        const labels: { date: Date; label: string; col: number }[] = [];
        for (let i = 0; i < VISIBLE_DAYS; i += 7) {
            labels.push({
                date: days[i],
                label: format(days[i], "MMM d"),
                col: i,
            });
        }
        return labels;
    }, [days]);

    const getBarProps = (task: any) => {
        if (!task.due_date) return null;
        const dueDate = startOfDay(new Date(task.due_date));
        const createdDate = startOfDay(new Date(task.created_at));
        const startCol = Math.max(0, differenceInDays(createdDate, startDate));
        const endCol = differenceInDays(dueDate, startDate);
        if (endCol < 0 || startCol >= VISIBLE_DAYS) return null;
        const clampedStart = Math.max(0, startCol);
        const clampedEnd = Math.min(VISIBLE_DAYS - 1, endCol);
        const width = Math.max(1, clampedEnd - clampedStart + 1);
        return { left: clampedStart * DAY_WIDTH, width: width * DAY_WIDTH - 4 };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Timeline
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate("next")}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {format(startDate, "MMM d")} — {format(endDate, "MMM d, yyyy")}
                    </span>
                </div>
            </div>

            {/* Gantt body */}
            <div className="flex-1 overflow-auto">
                <div className="flex min-w-max">
                    {/* Left sidebar — task names */}
                    <div className="w-64 shrink-0 sticky left-0 bg-background z-10 border-r">
                        {/* Header spacer */}
                        <div className="h-10 border-b" />
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="h-10 flex items-center px-3 gap-2 border-b hover:bg-muted/50 cursor-pointer"
                                onClick={() => router.push(`/org/${orgSlug}/projects/${project.id}/tasks/${task.id}`)}
                            >
                                <span className="text-xs font-mono text-muted-foreground shrink-0">{task.identifier}</span>
                                <span className="text-sm truncate">{task.title}</span>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                                No tasks with due dates
                            </div>
                        )}
                    </div>

                    {/* Grid */}
                    <div className="relative" style={{ width: VISIBLE_DAYS * DAY_WIDTH }}>
                        {/* Week header */}
                        <div className="h-10 border-b flex items-end pb-1 relative">
                            {weekLabels.map((w) => (
                                <span
                                    key={w.label}
                                    className="absolute text-xs text-muted-foreground font-medium"
                                    style={{ left: w.col * DAY_WIDTH + 4 }}
                                >
                                    {w.label}
                                </span>
                            ))}
                        </div>

                        {/* Day columns */}
                        <div className="absolute inset-x-0 top-10 bottom-0 flex">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "shrink-0 border-r",
                                        day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/30" : "",
                                        i === todayOffset ? "bg-primary/5" : ""
                                    )}
                                    style={{ width: DAY_WIDTH }}
                                />
                            ))}
                        </div>

                        {/* Today line */}
                        {todayOffset >= 0 && todayOffset < VISIBLE_DAYS && (
                            <div
                                className="absolute top-10 bottom-0 w-0.5 bg-primary/60 z-20 pointer-events-none"
                                style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                            />
                        )}

                        {/* Task bars */}
                        {tasks.map((task, rowIdx) => {
                            const bar = getBarProps(task);
                            if (!bar) return null;
                            const colorClass = STATUS_COLORS[task.status] ?? "bg-slate-400";
                            return (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "absolute h-6 rounded-full flex items-center px-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity",
                                        colorClass
                                    )}
                                    style={{
                                        top: rowIdx * 40 + 10 + 40, // 40px header
                                        left: bar.left + 2,
                                        width: bar.width,
                                    }}
                                    onClick={() => router.push(`/org/${orgSlug}/projects/${project.id}/tasks/${task.id}`)}
                                    title={task.title}
                                >
                                    <span className="text-[11px] text-white font-medium truncate">{task.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
