"use client";

import { CheckCircle2, Clock, FolderKanban, LayoutDashboard, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { TaskDistributionChart } from "@/components/analytics/task-distribution-chart";

interface AnalyticsViewProps {
    orgName: string;
    totalTasks: number;
    completedTasks: number;
    openTasks: number;
    projectCount: number;
    memberCount: number;
    weeklyVelocity: { week: string; completed: number }[];
    statusData: { name: string; value: number }[];
    priorityData: { name: string; value: number }[];
}

const STAT_CARDS = (props: AnalyticsViewProps) => [
    {
        label: "Total Tasks",
        value: props.totalTasks,
        icon: LayoutDashboard,
        description: "Across all projects",
    },
    {
        label: "Completed",
        value: props.completedTasks,
        icon: CheckCircle2,
        description: `${props.totalTasks > 0 ? Math.round((props.completedTasks / props.totalTasks) * 100) : 0}% completion rate`,
        accent: "text-emerald-600",
    },
    {
        label: "Open Tasks",
        value: props.openTasks,
        icon: Clock,
        description: "In progress or backlog",
        accent: "text-amber-600",
    },
    {
        label: "Active Projects",
        value: props.projectCount,
        icon: FolderKanban,
        description: `With ${props.memberCount} team member${props.memberCount !== 1 ? "s" : ""}`,
    },
];

export function AnalyticsView(props: AnalyticsViewProps) {
    const { orgName, totalTasks, completedTasks, weeklyVelocity, statusData, priorityData } = props;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Analytics
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{orgName} — Productivity overview</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS(props).map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    {stat.label}
                                    <Icon className={`h-4 w-4 ${stat.accent ?? "text-muted-foreground"}`} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-3xl font-bold ${stat.accent ?? ""}`}>{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Overall completion rate */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Overall Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</span>
                        <span className="font-semibold">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                </CardContent>
            </Card>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Velocity chart takes 3/5 */}
                <div className="lg:col-span-3">
                    <VelocityChart data={weeklyVelocity} />
                </div>
                {/* Distribution takes 2/5 */}
                <div className="lg:col-span-2">
                    <TaskDistributionChart statusData={statusData} priorityData={priorityData} />
                </div>
            </div>
        </div>
    );
}
