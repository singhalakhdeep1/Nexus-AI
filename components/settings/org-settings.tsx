"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";

const orgSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
});
type OrgForm = z.infer<typeof orgSchema>;

interface OrgSettingsProps {
    org: any;
    currentUserRole: string;
}

export function OrgSettings({ org, currentUserRole }: OrgSettingsProps) {
    const router = useRouter();
    const supabase = createClient();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isOwner = currentUserRole === "owner";

    const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<OrgForm>({
        resolver: zodResolver(orgSchema),
        defaultValues: { name: org.name, slug: org.slug },
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setValue("name", name, { shouldDirty: true });
    };

    const onSubmit = async (data: OrgForm) => {
        setIsSaving(true);
        const { error } = await supabase
            .from("organizations")
            .update({ name: data.name, slug: data.slug })
            .eq("id", org.id);

        if (error) {
            addToast({ title: "Failed to update", description: error.message, type: "error" });
        } else {
            addToast({ title: "Organization updated!", type: "success" });
            router.push(`/org/${data.slug}/settings`);
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        await supabase.from("organizations").delete().eq("id", org.id);
        router.push("/");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Organization Details</CardTitle>
                    <CardDescription>Update your organization name and URL slug</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="org-name">Organization Name</Label>
                            <Input id="org-name" {...register("name")} onChange={handleNameChange} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="org-slug">URL Slug</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">nexusflow.app/org/</span>
                                <Input id="org-slug" {...register("slug")} className="font-mono text-sm" />
                            </div>
                            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                        </div>

                        <Button type="submit" disabled={isSaving || !isDirty}>
                            {isSaving ? "Saving…" : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            {isOwner && (
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                        <CardDescription>Irreversible actions — proceed with caution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Delete Organization</p>
                                <p className="text-xs text-muted-foreground">
                                    Permanently delete {org.name} and all its data
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {org.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the organization, all projects, tasks, and members.
                                            This action <strong>cannot be undone</strong>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Deleting…" : "Yes, delete everything"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
