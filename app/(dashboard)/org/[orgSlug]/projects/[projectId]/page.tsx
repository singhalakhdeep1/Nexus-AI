import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectBoard } from "@/components/kanban/kanban-board";
import { KanbanErrorBoundary } from "@/components/error-boundaries";

interface ProjectPageProps {
    params: Promise<{ orgSlug: string; projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { orgSlug, projectId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: project } = await supabase
        .from("projects")
        .select("*, organizations(slug)")
        .eq("id", projectId)
        .single();
    if (!project) notFound();

    const { data: tasks } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url), labels:task_labels(labels(id, name, color))")
        .eq("project_id", projectId)
        .order("position", { ascending: true });

    const { data: members } = await supabase
        .from("project_members")
        .select("user_id, role, profiles(id, full_name, avatar_url)")
        .eq("project_id", projectId);

    const { data: labels } = await supabase
        .from("labels")
        .select("*")
        .eq("project_id", projectId);

    return (
        <KanbanErrorBoundary>
            <ProjectBoard
                project={project}
                initialTasks={tasks ?? []}
                members={members ?? []}
                labels={labels ?? []}
                orgSlug={orgSlug}
            />
        </KanbanErrorBoundary>
    );
}
