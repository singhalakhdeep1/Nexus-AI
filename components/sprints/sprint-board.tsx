"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Play, CheckCircle2, Calendar, Target, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateSprint } from "@/lib/hooks/use-sprints";
import { getInitials, stringToColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

const SPRINT_STATUS_CONFIG = {
    planned: { label: "Planned", variant: "outline" as const, color: "text-muted-foreground" },
    active: { label: "Active", variant: "default" as const, color: "text-emerald-600" },
    completed: { label: "Completed", variant: "secondary" as const, color: "text-muted-foreground" },
};

interface SprintBoardProps {
    project: { id: string; name: string; identifier: string };
    sprints: any[];
    tasks: any[];
    orgSlug: string;
}

export function SprintBoard({ project, sprints: initialSprints, tasks, orgSlug }: SprintBoardProps) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const updateSprint = useUpdateSprint(project.id);

    const handleStartSprint = async (sprintId: string) => {
        await updateSprint.mutateAsync({
            id: sprintId,
            is_active: true,
            start_date: new Date().toISOString(),
        });
        router.refresh();
    };

    const handleCompleteSprint = async (sprintId: string) => {
        await updateSprint.mutateAsync({
            id: sprintId,
            is_active: false,
            completed_at: new Date().toISOString(),
        });
        router.refresh();
    };

    const getSprintTasks = (sprintId: string) => tasks.filter((t) => t.sprint_id === sprintId);
    const backlogTasks = tasks.filter((t) => !t.sprint_id);

    return (
        <div className="p-6 space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Sprints</h1>
                    <p className="text-muted-foreground text-sm mt-1">{project.name}</p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Sprint
                </Button>
            </div>

            {/* Sprints */}
            {initialSprints.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Flag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No sprints yet</p>
                        <p className="text-sm mt-1">Create a sprint to organize your work into time-boxed iterations</p>
                        <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Sprint
                        </Button>
                    </CardContent>
                </Card>
            )}

            {initialSprints.map((sprint) => {
                const sprintTasks = getSprintTasks(sprint.id);
                const doneTasks = sprintTasks.filter((t) => t.status === "done").length;
                const progress = sprintTasks.length > 0 ? Math.round((doneTasks / sprintTasks.length) * 100) : 0;
                const config = SPRINT_STATUS_CONFIG[sprint.status as keyof typeof SPRINT_STATUS_CONFIG] ?? SPRINT_STATUS_CONFIG.planned;
                const daysLeft = sprint.end_date ? differenceInDays(new Date(sprint.end_date), new Date()) : null;

                return (
                    <Card key={sprint.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">{sprint.name}</CardTitle>
                                        <Badge variant={config.variant}>{config.label}</Badge>
                                    </div>
                                    {sprint.goal && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Target className="h-3.5 w-3.5" />
                                            <span>{sprint.goal}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {sprint.start_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(sprint.start_date), "MMM d")} — {sprint.end_date ? format(new Date(sprint.end_date), "MMM d, yyyy") : "No end"}
                                            </span>
                                        )}
                                        {daysLeft !== null && sprint.status === "active" && (
                                            <span className={daysLeft < 3 ? "text-destructive font-medium" : ""}>
                                                {daysLeft > 0 ? `${daysLeft}d remaining` : "Overdue"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {sprint.status === "planned" && (
                                        <Button size="sm" onClick={() => handleStartSprint(sprint.id)}>
                                            <Play className="h-3.5 w-3.5 mr-1.5" />
                                            Start Sprint
                                        </Button>
                                    )}
                                    {sprint.status === "active" && (
                                        <Button size="sm" variant="outline" onClick={() => handleCompleteSprint(sprint.id)}>
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {sprintTasks.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{doneTasks} / {sprintTasks.length} tasks done</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                </div>
                            )}
                        </CardHeader>

                        {sprintTasks.length > 0 && (
                            <CardContent className="pt-0">
                                <div className="space-y-1">
                                    {sprintTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                            onClick={() => router.push(`/org/${orgSlug}/projects/${project.id}/tasks/${task.id}`)}
                                        >
                                            <PriorityBadge priority={task.priority} iconOnly />
                                            <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">{task.identifier}</span>
                                            <span className="text-sm flex-1 line-clamp-1">{task.title}</span>
                                            <StatusBadge status={task.status} compact />
                                            {task.assignee && (
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={task.assignee.avatar_url} />
                                                    <AvatarFallback className="text-[8px]" style={{ backgroundColor: stringToColor(task.assignee.full_name || "") }}>
                                                        {getInitials(task.assignee.full_name || "")}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}

            {/* Backlog */}
            {backlogTasks.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-muted-foreground">Backlog ({backlogTasks.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-1">
                            {backlogTasks.slice(0, 20).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                    onClick={() => router.push(`/org/${orgSlug}/projects/${project.id}/tasks/${task.id}`)}
                                >
                                    <PriorityBadge priority={task.priority} iconOnly />
                                    <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">{task.identifier}</span>
                                    <span className="text-sm flex-1 line-clamp-1">{task.title}</span>
                                    <StatusBadge status={task.status} compact />
                                </div>
                            ))}
                            {backlogTasks.length > 20 && (
                                <p className="text-xs text-muted-foreground text-center pt-2">
                                    +{backlogTasks.length - 20} more in backlog
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <CreateSprintDialog open={createOpen} onOpenChange={setCreateOpen} projectId={project.id} />
        </div>
    );
}
