"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Github, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { toast } from "@/lib/hooks/use-toast";

const passwordRequirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "At least one number", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: { full_name: data.full_name },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                toast({ title: "Registration failed", description: error.message, variant: "destructive" });
                return;
            }

            toast({
                title: "Account created!",
                description: "Check your email to confirm your account.",
                variant: "success" as never,
            });
            router.push("/login?registered=true");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
            toast({ title: "OAuth error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
                <p className="text-sm text-muted-foreground mt-1">Free forever for teams up to 5 members</p>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGithubSignup}>
                <Github className="h-4 w-4" />
                Continue with GitHub
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or sign up with email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                        id="full_name"
                        placeholder="Jane Smith"
                        autoComplete="name"
                        {...register("full_name")}
                    />
                    {errors.full_name && (
                        <p className="text-xs text-destructive">{errors.full_name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="jane@company.com"
                        autoComplete="email"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Choose a strong password"
                            autoComplete="new-password"
                            {...register("password", {
                                onChange: (e) => setPassword(e.target.value),
                            })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Password strength indicators */}
                    {password && (
                        <div className="space-y-1.5 pt-1">
                            {passwordRequirements.map((req) => (
                                <div key={req.label} className="flex items-center gap-2">
                                    <CheckCircle
                                        className={`h-3.5 w-3.5 ${req.test(password) ? "text-green-500" : "text-muted-foreground/30"
                                            }`}
                                    />
                                    <span
                                        className={`text-xs ${req.test(password) ? "text-green-600" : "text-muted-foreground"
                                            }`}
                                    >
                                        {req.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                        id="confirm_password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("confirm_password")}
                    />
                    {errors.confirm_password && (
                        <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    By creating an account you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
