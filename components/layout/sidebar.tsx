"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, FolderKanban, Users, Settings, ChevronRight,
    Plus, Zap, BarChart3, Bell, ChevronsLeft, Folder,
} from "lucide-react";
import { cn, getInitials, stringToColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Organization, Profile, Project } from "@/types";

interface SidebarProps {
    org: Organization;
    profile: Profile | null;
    projects: Partial<Project>[];
    orgSlug: string;
}

export function Sidebar({ org, profile, projects, orgSlug }: SidebarProps) {
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar, openCreateTask } = useUIStore();

    const navItems = [
        { href: `/org/${orgSlug}`, label: "Overview", icon: LayoutDashboard },
        { href: `/org/${orgSlug}/projects`, label: "Projects", icon: FolderKanban },
        { href: `/org/${orgSlug}/members`, label: "Members", icon: Users },
        { href: `/org/${orgSlug}/analytics`, label: "Analytics", icon: BarChart3 },
        { href: `/org/${orgSlug}/settings`, label: "Settings", icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === `/org/${orgSlug}`) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            <aside
                className={cn(
                    "fixed lg:relative z-50 lg:z-auto flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
                    isSidebarOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full lg:translate-x-0 lg:w-16"
                )}
            >
                {/* Org header */}
                <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border">
                    {isSidebarOpen ? (
                        <Link
                            href={`/org/${orgSlug}`}
                            className="flex items-center gap-2.5 flex-1 min-w-0"
                        >
                            <div
                                className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: "#6366f1" }}
                            >
                                {getInitials(org.name)}
                            </div>
                            <span className="font-semibold text-sm truncate">{org.name}</span>
                        </Link>
                    ) : (
                        <div className="mx-auto h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={toggleSidebar}
                        className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0 hidden lg:flex"
                    >
                        <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isSidebarOpen && "rotate-180")} />
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-2 py-3">
                    {/* Main nav */}
                    <nav className="space-y-0.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors group",
                                        isActive(item.href)
                                            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                    {isSidebarOpen && isActive(item.href) && (
                                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Projects section */}
                    {isSidebarOpen && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between px-2 mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                                    Projects
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-5 w-5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                    asChild
                                >
                                    <Link href={`/org/${orgSlug}/projects`}>
                                        <Plus className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>

                            <div className="space-y-0.5">
                                {projects.length === 0 && (
                                    <p className="px-2 py-1.5 text-xs text-sidebar-foreground/40">No projects yet</p>
                                )}
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/org/${orgSlug}/projects/${project.id}`}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                            pathname.includes(`/projects/${project.id}`)
                                                ? "bg-sidebar-accent text-sidebar-foreground"
                                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                        )}
                                    >
                                        <div
                                            className="h-4 w-4 rounded shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: project.color || "#6366f1" }}
                                        >
                                            <Folder className="h-2.5 w-2.5 text-white" />
                                        </div>
                                        <span className="truncate">{project.name}</span>
                                        <span className="ml-auto text-[10px] text-sidebar-foreground/30 font-mono">
                                            {project.identifier}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {/* Profile section */}
                <div className="border-t border-sidebar-border p-2">
                    <div className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md", isSidebarOpen && "")}>
                        <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={profile?.avatar_url ?? undefined} />
                            <AvatarFallback
                                className="text-[10px]"
                                style={{ backgroundColor: stringToColor(profile?.full_name || "U") }}
                            >
                                {getInitials(profile?.full_name || "User")}
                            </AvatarFallback>
                        </Avatar>
                        {isSidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-sidebar-foreground">
                                    {profile?.full_name || "User"}
                                </p>
                                <p className="text-[10px] text-sidebar-foreground/40 truncate">
                                    {org.plan} plan
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}


