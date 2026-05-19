import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { subWeeks, startOfWeek, format } from "date-fns";

interface AnalyticsPageProps {
    params: Promise<{ orgSlug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
    const { orgSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const orgRes = await supabase.from("organizations").select("id, name").eq("slug", orgSlug).single();
    if (!orgRes.data) redirect("/");

    const orgId = orgRes.data.id;

    // Fetch all tasks for this org
    const [tasksRes, projectsRes, membersRes] = await Promise.all([
        supabase
            .from("tasks")
            .select("id, status, priority, created_at, completed_at, estimate, project_id")
            .eq("org_id", orgId)
            .order("created_at", { ascending: true }),
        supabase
            .from("projects")
            .select("id, name, status")
            .eq("org_id", orgId),
        supabase
            .from("organization_members")
            .select("user_id")
            .eq("org_id", orgId),
    ]);

    const tasks = tasksRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const memberCount = membersRes.data?.length ?? 0;

    // Weekly velocity: tasks completed per week for past 8 weeks
    const weeklyVelocity = Array.from({ length: 8 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(new Date(), 7 - i));
        const weekEnd = subWeeks(weekStart, -1);
        const count = tasks.filter((t) => {
            if (!t.completed_at) return false;
            const d = new Date(t.completed_at);
            return d >= weekStart && d < weekEnd;
        }).length;
        return { week: format(weekStart, "MMM d"), completed: count };
    });

    // Status distribution
    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    for (const t of tasks) {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    }

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

    const completedCount = tasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
    const openCount = tasks.length - completedCount;

    return (
        <AnalyticsView
            orgName={orgRes.data.name}
            totalTasks={tasks.length}
            completedTasks={completedCount}
            openTasks={openCount}
            projectCount={projects.length}
            memberCount={memberCount}
            weeklyVelocity={weeklyVelocity}
            statusData={statusData}
            priorityData={priorityData}
        />
    );
}
