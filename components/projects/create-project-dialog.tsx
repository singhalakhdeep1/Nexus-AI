"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project";
import { PROJECT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    orgSlug: string;
}

export function CreateProjectDialog({ open, onOpenChange, orgId, orgSlug }: CreateProjectDialogProps) {
    const router = useRouter();
    const createProject = useCreateProject(orgId);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CreateProjectInput>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { color: PROJECT_COLORS[0] },
    });

    const selectedColor = watch("color");

    const onSubmit = async (data: CreateProjectInput) => {
        try {
            const project = await createProject.mutateAsync(data);
            reset();
            onOpenChange(false);
            router.push(`/org/${orgSlug}/projects/${project.id}`);
        } catch { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Project Name</Label>
                        <Input placeholder="e.g. Mobile App Redesign" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Identifier</Label>
                        <Input
                            placeholder="e.g. MOB"
                            maxLength={5}
                            {...register("identifier")}
                            className="font-mono uppercase"
                        />
                        {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                            placeholder="What is this project about?"
                            rows={2}
                            {...register("description")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setValue("color", c)}
                                    className={cn(
                                        "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                                        selectedColor === c ? "border-foreground scale-110" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createProject.isPending}>
                            {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
