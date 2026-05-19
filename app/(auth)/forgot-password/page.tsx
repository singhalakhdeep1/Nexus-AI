"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        setIsLoading(true);
        await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setSent(true);
        setIsLoading(false);
    };

    if (sent) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Check your email</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        We sent you a password reset link. It expires in 1 hour.
                    </p>
                </div>
                <Button variant="outline" asChild className="w-full">
                    <Link href="/login"><ArrowLeft className="h-4 w-4" /> Back to Sign In</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Enter your email and we&apos;ll send you a reset link.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="name@company.com" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
            </form>

            <Button variant="ghost" asChild className="w-full">
                <Link href="/login"><ArrowLeft className="h-4 w-4" /> Back to Sign In</Link>
            </Button>
        </div>
    );
}
