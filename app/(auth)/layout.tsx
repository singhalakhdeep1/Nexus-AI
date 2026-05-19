import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding panel */}
            <div className="hidden lg:flex flex-col justify-between p-10 bg-sidebar text-sidebar-foreground">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xl font-bold">NexusFlow</span>
                </div>

                <div className="space-y-6">
                    <blockquote className="text-xl font-medium leading-relaxed text-sidebar-foreground/90">
                        &ldquo;NexusFlow cut our sprint planning from 3 hours to 30 minutes.
                        The AI task generation is genuinely magic.&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                            SC
                        </div>
                        <div>
                            <div className="font-semibold text-sm">Sarah Chen</div>
                            <div className="text-xs text-sidebar-foreground/60">Engineering Manager @ CloudBase</div>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-sidebar-foreground/40">
                    © {new Date().getFullYear()} NexusFlow Inc. All rights reserved.
                </p>
            </div>

            {/* Right: Auth form */}
            <div className="flex items-center justify-center p-6 lg:p-10">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-8">
                        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                            <Zap className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-lg font-bold">NexusFlow</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
