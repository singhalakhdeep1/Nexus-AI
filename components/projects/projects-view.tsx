"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Grid3X3, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectsViewProps {
    projects: any[];
    orgId: string;
    orgSlug: string;
}

export function ProjectsView({ projects, orgId, orgSlug }: ProjectsViewProps) {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" /> New Project
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex border rounded-md overflow-hidden">
                    <button
                        onClick={() => setView("grid")}
                        className={`p-2 ${view === "grid" ? "bg-muted" : "hover:bg-muted/50"}`}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView("list")}
                        className={`p-2 ${view === "list" ? "bg-muted" : "hover:bg-muted/50"}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                        <FolderKanban className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold">
                            {search ? "No projects match your search" : "No projects yet"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {search ? "Try a different search term" : "Create your first project to get started"}
                        </p>
                    </div>
                    {!search && (
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" /> Create Project
                        </Button>
                    )}
                </div>
            )}

            {/* Grid view */}
            {filtered.length > 0 && view === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((project) => {
                        const stats = project.project_stats;
                        const total = stats?.total_tasks ?? 0;
                        const done = stats?.completed_tasks ?? 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                        return (
                            <Link key={project.id} href={`/org/${orgSlug}/projects/${project.id}`}>
                                <Card className="h-full hover:border-primary/40 transition-all cursor-pointer group">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div
                                                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: project.color || "#6366f1" }}
                                            >
                                                <FolderKanban className="h-5 w-5 text-white" />
                                            </div>
                                            <Badge
                                                variant={project.status === "active" ? "default" : "secondary"}
                                                className="capitalize text-xs"
                                            >
                                                {project.status}
                                            </Badge>
                                        </div>

                                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                                            {project.name}
                                        </h3>
                                        {project.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                {project.description}
                                            </p>
                                        )}

                                        <div className="mt-auto space-y-2 pt-2">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{done}/{total} tasks</span>
                                                <span>{pct}%</span>
                                            </div>
                                            <Progress value={pct} className="h-1.5" />
                                            <p className="text-[11px] text-muted-foreground">
                                                Updated {formatRelativeTime(project.updated_at)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* List view */}
            {filtered.length > 0 && view === "list" && (
                <Card>
                    <div className="divide-y">
                        {filtered.map((project) => {
                            const stats = project.project_stats;
                            const total = stats?.total_tasks ?? 0;
                            const done = stats?.completed_tasks ?? 0;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                            return (
                                <Link key={project.id} href={`/org/${orgSlug}/projects/${project.id}`}>
                                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                                        <div
                                            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: project.color || "#6366f1" }}
                                        >
                                            <FolderKanban className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{project.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{project.identifier}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs">
                                            <Progress value={pct} className="h-1.5 flex-1" />
                                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                                        </div>
                                        <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize text-xs">
                                            {project.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground hidden md:block">
                                            {formatRelativeTime(project.updated_at)}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </Card>
            )}

            <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} orgId={orgId} orgSlug={orgSlug} />
        </div>
    );
}
