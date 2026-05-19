import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GanttChart } from "@/components/timeline/gantt-chart";
import { addDays, subDays } from "date-fns";

interface TimelinePageProps {
    params: Promise<{ orgSlug: string; projectId: string }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
    const { orgSlug, projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [projectRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("id, name").eq("id", projectId).single(),
        supabase
            .from("tasks")
            .select("id, title, identifier, status, priority, due_date, created_at, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)")
            .eq("project_id", projectId)
            .not("due_date", "is", null)
            .order("due_date", { ascending: true }),
    ]);

    if (!projectRes.data) redirect(`/org/${orgSlug}/projects`);

    return (
        <GanttChart
            project={projectRes.data}
            tasks={tasksRes.data ?? []}
            orgSlug={orgSlug}
        />
    );
}
