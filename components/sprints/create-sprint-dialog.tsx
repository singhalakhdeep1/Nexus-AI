"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSprint } from "@/lib/hooks/use-sprints";
import { useToast } from "@/lib/hooks/use-toast";

const sprintSchema = z.object({
    name: z.string().min(1, "Sprint name is required").max(60),
    goal: z.string().max(200).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
});
type SprintForm = z.infer<typeof sprintSchema>;

interface CreateSprintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
}

export function CreateSprintDialog({ open, onOpenChange, projectId }: CreateSprintDialogProps) {
    const createSprint = useCreateSprint(projectId);
    const { addToast } = useToast();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<SprintForm>({
        resolver: zodResolver(sprintSchema),
        defaultValues: { name: "", goal: "", start_date: "", end_date: "" },
    });

    const onSubmit = async (data: SprintForm) => {
        try {
            await createSprint.mutateAsync({
                name: data.name,
                goal: data.goal || undefined,
                start_date: data.start_date || undefined,
                end_date: data.end_date || undefined,
            });
            addToast({ title: "Sprint created!", type: "success" });
            reset();
            onOpenChange(false);
        } catch (err: any) {
            addToast({ title: "Failed to create sprint", description: err.message, type: "error" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Sprint</DialogTitle>
                    <DialogDescription>
                        Time-box your work into a focused iteration.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="sprint-name">Sprint Name *</Label>
                        <Input id="sprint-name" placeholder="Sprint 1" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sprint-goal">Sprint Goal</Label>
                        <Textarea
                            id="sprint-goal"
                            placeholder="What will the team accomplish this sprint?"
                            className="resize-none"
                            rows={2}
                            {...register("goal")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="sprint-start">Start Date</Label>
                            <Input id="sprint-start" type="date" {...register("start_date")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sprint-end">End Date</Label>
                            <Input id="sprint-end" type="date" {...register("end_date")} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createSprint.isPending}>
                            {createSprint.isPending ? "Creating…" : "Create Sprint"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
