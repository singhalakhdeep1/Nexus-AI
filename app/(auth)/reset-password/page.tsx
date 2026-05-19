"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { toast } from "@/lib/hooks/use-toast";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordInput) => {
        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({ password: data.password });
        setIsLoading(false);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            return;
        }

        toast({ title: "Password updated!", description: "You can now sign in with your new password." });
        router.push("/login");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Set new password</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input id="confirm_password" type="password" placeholder="••••••••" {...register("confirm_password")} />
                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update Password
                </Button>
            </form>
        </div>
    );
}
