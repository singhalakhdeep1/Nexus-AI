"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/project";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import type { TaskStatus } from "@/types";

interface CreateTaskDialogProps {
    open: boolean;
    onClose: () => void;
    projectId?: string;
    defaultStatus?: TaskStatus;
    members: any[];
    labels: any[];
}

export function CreateTaskDialog({
    open, onClose, projectId, defaultStatus, members, labels,
}: CreateTaskDialogProps) {
    const createTask = useCreateTask(projectId ?? "");

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<CreateTaskInput>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            status: defaultStatus || "backlog",
            priority: "medium",
        },
    });

    const onSubmit = async (data: CreateTaskInput) => {
        if (!projectId) return;
        try {
            await createTask.mutateAsync({ ...data, project_id: projectId });
            reset();
            onClose();
        } catch { }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input placeholder="Task title…" {...register("title")} />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea placeholder="Add details…" rows={3} {...register("description")} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TASK_STATUSES.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TASK_PRIORITIES.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    {members.length > 0 && (
                        <div className="space-y-2">
                            <Label>Assignee (optional)</Label>
                            <Controller
                                name="assignee_id"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {members.map((m: any) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={createTask.isPending || !projectId}>
                            {createTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
