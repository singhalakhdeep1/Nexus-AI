import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { DashboardStats } from "@/types";

interface OrgPageProps {
    params: Promise<{ orgSlug: string }>;
}

export default async function OrgOverviewPage({ params }: OrgPageProps) {
    const { orgSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch org
    const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("slug", orgSlug)
        .single();
    if (!org) redirect("/");

    // Parallel data fetch
    const [projectsRes, tasksRes, membersRes, activitiesRes] = await Promise.all([
        supabase.from("projects").select("id, name, identifier, color, status").eq("organization_id", org.id).limit(5),
        supabase.from("tasks").select("id, title, status, priority, created_at, identifier").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("organization_members").select("user_id, role").eq("organization_id", org.id),
        supabase.from("activities").select("*, profiles(full_name, avatar_url)").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const tasks = tasksRes.data ?? [];
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

    const stats: DashboardStats = {
        totalProjects: projectsRes.data?.length ?? 0,
        totalTasks,
        completedTasks: doneTasks,
        inProgressTasks,
        totalMembers: membersRes.data?.length ?? 0,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    };

    return (
        <DashboardOverview
            stats={stats}
            recentProjects={projectsRes.data ?? []}
            recentTasks={tasks}
            activities={activitiesRes.data ?? []}
            orgSlug={orgSlug}
        />
    );
}
