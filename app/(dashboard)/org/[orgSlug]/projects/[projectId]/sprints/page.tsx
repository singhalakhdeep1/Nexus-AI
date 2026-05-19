import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SprintBoard } from "@/components/sprints/sprint-board";

interface SprintsPageProps {
    params: Promise<{ orgSlug: string; projectId: string }>;
}

export default async function SprintsPage({ params }: SprintsPageProps) {
    const { orgSlug, projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [projectRes, sprintsRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("id, name, identifier").eq("id", projectId).single(),
        supabase
            .from("sprints")
            .select("*")
            .eq("project_id", projectId)
            .order("start_date", { ascending: false }),
        supabase
            .from("tasks")
            .select("id, title, status, priority, identifier, sprint_id, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)")
            .eq("project_id", projectId),
    ]);

    if (!projectRes.data) redirect(`/org/${orgSlug}/projects`);

    return (
        <SprintBoard
            project={projectRes.data}
            sprints={sprintsRes.data ?? []}
            tasks={tasksRes.data ?? []}
            orgSlug={orgSlug}
        />
    );
}
