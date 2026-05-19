"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FolderKanban, LayoutDashboard, Settings, Users, Plus } from "lucide-react";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandPaletteProps {
    orgSlug: string;
    projects: any[];
}

export function CommandPalette({ orgSlug, projects }: CommandPaletteProps) {
    const { isCommandPaletteOpen, setCommandPaletteOpen, openCreateTask } = useUIStore();
    const router = useRouter();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            setCommandPaletteOpen(true);
        }
    }, [setCommandPaletteOpen]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const navigate = (href: string) => {
        router.push(href);
        setCommandPaletteOpen(false);
    };

    return (
        <Dialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
            <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
                <Command className="rounded-lg border-0 shadow-none">
                    <div className="flex items-center gap-2 px-4 py-3 border-b">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Command.Input
                            placeholder="Search tasks, projects, members…"
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                        />
                        <kbd className="text-xs bg-muted border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
                    </div>
                    <Command.List className="max-h-80 overflow-y-auto p-2">
                        <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Quick Actions" className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                            <Command.Item
                                onSelect={() => { openCreateTask(undefined, undefined); setCommandPaletteOpen(false); }}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-muted text-sm aria-selected:bg-muted"
                            >
                                <Plus className="h-4 w-4 text-muted-foreground" />
                                Create New Task
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Navigation" className="text-xs text-muted-foreground font-semibold px-2 py-1.5 mt-2">
                            {[
                                { label: "Overview", icon: LayoutDashboard, href: `/org/${orgSlug}` },
                                { label: "Projects", icon: FolderKanban, href: `/org/${orgSlug}/projects` },
                                { label: "Members", icon: Users, href: `/org/${orgSlug}/members` },
                                { label: "Settings", icon: Settings, href: `/org/${orgSlug}/settings` },
                            ].map((item) => (
                                <Command.Item
                                    key={item.href}
                                    onSelect={() => navigate(item.href)}
                                    className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-muted text-sm aria-selected:bg-muted"
                                >
                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                    {item.label}
                                </Command.Item>
                            ))}
                        </Command.Group>

                        {projects.length > 0 && (
                            <Command.Group heading="Projects" className="text-xs text-muted-foreground font-semibold px-2 py-1.5 mt-2">
                                {projects.map((project) => (
                                    <Command.Item
                                        key={project.id}
                                        onSelect={() => navigate(`/org/${orgSlug}/projects/${project.id}`)}
                                        className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-muted text-sm aria-selected:bg-muted"
                                    >
                                        <div
                                            className="h-4 w-4 rounded shrink-0"
                                            style={{ backgroundColor: project.color || "#6366f1" }}
                                        />
                                        {project.name}
                                        <span className="ml-auto text-xs text-muted-foreground font-mono">{project.identifier}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
