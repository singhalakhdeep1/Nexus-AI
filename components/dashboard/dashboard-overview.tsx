"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Clock, FolderKanban, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface DashboardOverviewProps {
    stats: DashboardStats;
    recentProjects: any[];
    recentTasks: any[];
    activities: any[];
    orgSlug: string;
}

const StatCard = ({
    title, value, subtitle, icon: Icon, trend, color,
}: {
    title: string; value: string | number; subtitle: string;
    icon: React.ComponentType<{ className?: string }>; trend?: string; color: string;
}) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
            {trend && (
                <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {trend}
                </div>
            )}
        </CardContent>
    </Card>
);

export function DashboardOverview({ stats, recentProjects, recentTasks, activities, orgSlug }: DashboardOverviewProps) {
    const statCards = [
        {
            title: "Total Projects",
            value: formatNumber(stats.totalProjects),
            subtitle: "Active workstreams",
            icon: FolderKanban,
            color: "bg-blue-500",
            trend: "Active & growing",
        },
        {
            title: "Total Tasks",
            value: formatNumber(stats.totalTasks),
            subtitle: `${stats.completedTasks} completed`,
            icon: CheckCircle,
            color: "bg-green-500",
        },
        {
            title: "In Progress",
            value: formatNumber(stats.inProgressTasks),
            subtitle: "Tasks being worked on",
            icon: Clock,
            color: "bg-orange-500",
        },
        {
            title: "Team Members",
            value: formatNumber(stats.totalMembers),
            subtitle: "Across your org",
            icon: Users,
            color: "bg-purple-500",
        },
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Overview</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Here&apos;s what&apos;s happening across your workspace
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/org/${orgSlug}/projects`}>
                        <FolderKanban className="h-4 w-4" />
                        View Projects
                    </Link>
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>

            {/* Completion rate */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="font-semibold">Overall Completion Rate</p>
                            <p className="text-sm text-muted-foreground">Tasks completed this sprint</p>
                        </div>
                        <span className="text-3xl font-bold text-primary">{stats.completionRate}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent tasks */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base">Recent Tasks</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/org/${orgSlug}/projects`}>
                                    View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentTasks.length === 0 ? (
                                <div className="px-6 py-10 text-center">
                                    <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No tasks yet. Create your first project!</p>
                                    <Button className="mt-4" size="sm" asChild>
                                        <Link href={`/org/${orgSlug}/projects`}>Create Project</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentTasks.map((task) => (
                                        <div key={task.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors group">
                                            <PriorityBadge priority={task.priority} compact />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">{task.identifier}</p>
                                            </div>
                                            <StatusBadge status={task.status} />
                                            <span className="text-xs text-muted-foreground hidden sm:block">
                                                {formatRelativeTime(task.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Activity feed */}
                <div>
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ActivityFeed activities={activities} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold">Projects</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/org/${orgSlug}/projects`}>
                                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentProjects.map((project) => (
                            <Link key={project.id} href={`/org/${orgSlug}/projects/${project.id}`}>
                                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div
                                                className="h-8 w-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: project.color || "#6366f1" }}
                                            >
                                                <FolderKanban className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{project.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{project.identifier}</p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={project.status === "active" ? "default" : "secondary"}
                                            className="text-xs capitalize"
                                        >
                                            {project.status}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
