"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { getInitials, stringToColor } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
    profile: any;
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
    const router = useRouter();
    const supabase = createClient();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile?.full_name || "",
            avatar_url: profile?.avatar_url || "",
        },
    });

    const avatarUrl = watch("avatar_url");
    const fullName = watch("full_name");

    const onSubmit = async (data: ProfileForm) => {
        setIsSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({ full_name: data.full_name, avatar_url: data.avatar_url || null })
            .eq("id", profile.id);

        if (error) {
            addToast({ title: "Failed to update profile", description: error.message, type: "error" });
        } else {
            addToast({ title: "Profile updated!", type: "success" });
            router.refresh();
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                    <CardDescription>Update your display name and avatar</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Avatar preview */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={avatarUrl || undefined} />
                                <AvatarFallback
                                    className="text-lg"
                                    style={{ backgroundColor: stringToColor(fullName) }}
                                >
                                    {getInitials(fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="avatar_url">Avatar URL</Label>
                                <Input
                                    id="avatar_url"
                                    placeholder="https://github.com/username.png"
                                    {...register("avatar_url")}
                                />
                                {errors.avatar_url && (
                                    <p className="text-xs text-destructive">{errors.avatar_url.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input id="full_name" placeholder="Jane Smith" {...register("full_name")} />
                            {errors.full_name && (
                                <p className="text-xs text-destructive">{errors.full_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input value={profile?.email || ""} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                        </div>

                        <Button type="submit" disabled={isSaving || !isDirty}>
                            {isSaving ? "Saving…" : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
