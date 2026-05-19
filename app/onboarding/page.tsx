"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Zap, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/lib/validations/project";
import { toast } from "@/lib/hooks/use-toast";
import { generateSlug } from "@/lib/utils";

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateOrganizationInput>({
        resolver: zodResolver(createOrganizationSchema),
    });

    const orgName = watch("name");

    const onSubmit = async (data: CreateOrganizationInput) => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const slug = data.slug || generateSlug(data.name);
            const orgId = crypto.randomUUID();

            const { error: orgError } = await supabase
                .from("organizations")
                .insert({ id: orgId, name: data.name, slug, plan: "free" });

            if (orgError) throw orgError;

            const { error: memberError } = await supabase
                .from("organization_members")
                .insert({ organization_id: orgId, user_id: user.id, role: "owner" });

            if (memberError) throw memberError;

            router.push(`/org/${slug}`);
        } catch (err: any) {
            toast({ title: "Failed to create workspace", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex h-12 w-12 rounded-2xl bg-primary items-center justify-center mb-4">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Create your workspace</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Set up your organization to get started with NexusFlow
                    </p>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label>Organization Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Acme Corp"
                                        {...register("name", {
                                            onChange: (e) => setValue("slug", generateSlug(e.target.value)),
                                        })}
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Workspace URL</Label>
                                <div className="flex items-center gap-0 border rounded-md overflow-hidden">
                                    <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-r whitespace-nowrap">
                                        nexusflow.app/org/
                                    </span>
                                    <Input
                                        className="border-0 rounded-none focus-visible:ring-0"
                                        placeholder="acme-corp"
                                        {...register("slug")}
                                    />
                                </div>
                                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                Create Workspace
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
