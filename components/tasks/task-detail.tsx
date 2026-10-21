"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft, Calendar, Clock, Edit3, Flag, MessageSquare,
    Paperclip, Tag, User, Trash2, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskComments } from "@/components/tasks/task-comments";
import { useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { getInitials, stringToColor, formatRelativeTime, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TaskStatus, TaskPriority } from "@/types";

interface TaskDetailViewProps {
    task: any;
    comments: any[];
    members: any[];
    labels: any[];
    activities: any[];
    currentUserId: string;
    orgSlug: string;
    projectId: string;
}

export function TaskDetailView({ task, comments, members, labels, activities, currentUserId, orgSlug, projectId }: TaskDetailViewProps) {
    const router = useRouter();
    const [description, setDescription] = useState(task.description || "");
    const [isSavingDesc, setIsSavingDesc] = useState(false);
    const updateTask = useUpdateTask(projectId);
    const deleteTask = useDeleteTask(projectId);

    const handleStatusChange = (status: TaskStatus) => {
        updateTask.mutate({ id: task.id, status });
    };

    const handlePriorityChange = (priority: TaskPriority) => {
        updateTask.mutate({ id: task.id, priority });
    };

    const handleAssigneeChange = (assigneeId: string) => {
        updateTask.mutate({ id: task.id, assignee_id: assigneeId || undefined });
    };

    const handleSaveDescription = async () => {
        setIsSavingDesc(true);
        await updateTask.mutateAsync({ id: task.id, description });
        setIsSavingDesc(false);
    };

    const handleDelete = async () => {
        await deleteTask.mutateAsync(task.id);
        router.push(`/org/${orgSlug}/projects/${projectId}`);
    };

    const allMembers = members.map((m: any) => m.profiles).filter(Boolean);
    const taskLabels = task.labels?.map((tl: any) => tl.labels).filter(Boolean) ?? [];

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <span>/</span>
                        <Link href={`/org/${orgSlug}/projects/${projectId}`} className="hover:text-foreground transition-colors">
                            Project Board
                        </Link>
                        <span>/</span>
                        <span className="font-mono text-xs">{task.identifier}</span>
                    </div>

                    {/* Task header */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl font-bold leading-tight flex-1">{task.title}</h1>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete <strong>{task.identifier}</strong>. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleDelete}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                            {taskLabels.map((label: any) => (
                                <Badge
                                    key={label.id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: label.color, color: label.color }}
                                >
                                    {label.name}
                                </Badge>
                            ))}
                            <span className="text-xs text-muted-foreground ml-auto">
                                Created {formatRelativeTime(task.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Tabs: Description / Comments / Activity */}
                    <Tabs defaultValue="description">
                        <TabsList className="mb-4">
                            <TabsTrigger value="description">Description</TabsTrigger>
                            <TabsTrigger value="comments">
                                Comments {comments.length > 0 && <span className="ml-1 text-xs">({comments.length})</span>}
                            </TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                        </TabsList>

                        <TabsContent value="description" className="space-y-3">
                            <RichTextEditor
                                content={description}
                                onChange={setDescription}
                                placeholder="Add a description… (supports markdown-style formatting)"
                                minHeight="200px"
                            />
                            {description !== (task.description || "") && (
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setDescription(task.description || "")}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSaveDescription} disabled={isSavingDesc}>
                                        Save
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="comments">
                            <TaskComments
                                comments={comments}
                                taskId={task.id}
                                projectId={projectId}
                                currentUserId={currentUserId}
                            />
                        </TabsContent>

                        <TabsContent value="activity">
                            <div className="space-y-3">
                                {activities.map((activity: any) => (
                                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                                        <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                                            <AvatarImage src={activity.actor?.avatar_url} />
                                            <AvatarFallback className="text-[9px]" style={{ backgroundColor: stringToColor(activity.actor?.full_name || "") }}>
                                                {getInitials(activity.actor?.full_name || "")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <span className="font-medium">{activity.actor?.full_name}</span>{" "}
                                            <span className="text-muted-foreground">
                                                {activity.activity_type.replace(/_/g, " ")}
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatRelativeTime(activity.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {activities.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Sidebar properties */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l bg-muted/20 p-5 space-y-5 overflow-y-auto">
                <h3 className="font-semibold text-sm">Properties</h3>

                <div className="space-y-4">
                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Status</label>
                        <Select value={task.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TASK_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Priority</label>
                        <Select value={task.priority} onValueChange={handlePriorityChange}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TASK_PRIORITIES.map((p) => (
                                    <SelectItem key={p} value={p}>{p.replace(/_/g, " ")}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Assignee</label>
                        <Select value={task.assignee?.id || ""} onValueChange={handleAssigneeChange}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {allMembers.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Due Date
                        </label>
                        <input
                            type="date"
                            defaultValue={task.due_date?.split("T")[0] || ""}
                            onChange={(e) => updateTask.mutate({ id: task.id, due_date: e.target.value || undefined })}
                            className="w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Estimate */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Estimate (points)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={task.estimate || ""}
                            placeholder="0"
                            onChange={(e) => updateTask.mutate({ id: task.id } as any)}
                            className="w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <Separator />

                    {/* Reporter */}
                    {task.reporter && (
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-medium">Reporter</label>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.reporter.avatar_url} />
                                    <AvatarFallback className="text-[8px]">
                                        {getInitials(task.reporter.full_name || "")}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{task.reporter.full_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Sprint */}
                    {task.sprint && (
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-medium">Sprint</label>
                            <p className="text-sm">{task.sprint.name}</p>
                        </div>
                    )}

                    <Separator />

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Created {formatRelativeTime(task.created_at)}</p>
                        <p>Updated {formatRelativeTime(task.updated_at)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
