"use client";

import { Bell, Search, Sun, Moon, Menu, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials, stringToColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Organization, Profile } from "@/types";

interface HeaderProps {
    org: Organization;
    profile: Profile | null;
    orgSlug: string;
}

export function Header({ org, profile, orgSlug }: HeaderProps) {
    const { toggleSidebar, setCommandPaletteOpen, unreadNotifications } = useUIStore();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 gap-4 shrink-0">
            {/* Left: Mobile menu + search */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleSidebar}
                    className="lg:hidden"
                >
                    <Menu className="h-4 w-4" />
                </Button>

                <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors min-w-[200px]"
                >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search tasks…</span>
                    <kbd className="ml-auto font-mono text-xs bg-background border rounded px-1">⌘K</kbd>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                {/* New Task shortcut */}
                <Button size="sm" className="hidden sm:flex gap-1.5" asChild>
                    <Link href={`/org/${orgSlug}/projects`}>
                        <Plus className="h-4 w-4" />
                        New Task
                    </Link>
                </Button>

                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                >
                    <Sun className="h-4 w-4 dark:hidden" />
                    <Moon className="h-4 w-4 hidden dark:block" />
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon-sm" className="relative" asChild>
                    <Link href={`/org/${orgSlug}/notifications`}>
                        <Bell className="h-4 w-4" />
                        {unreadNotifications > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                                {unreadNotifications > 9 ? "9+" : unreadNotifications}
                            </span>
                        )}
                    </Link>
                </Button>

                {/* Profile dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="rounded-full">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={profile?.avatar_url ?? undefined} />
                                <AvatarFallback
                                    className="text-[10px]"
                                    style={{ backgroundColor: stringToColor(profile?.full_name || "U") }}
                                >
                                    {getInitials(profile?.full_name || "User")}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                                <p className="text-xs text-muted-foreground">{org.name}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/org/${orgSlug}/settings/profile`}>Profile Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/org/${orgSlug}/settings`}>Workspace Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
