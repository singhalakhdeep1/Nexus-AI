import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TaskDetailView } from "@/components/tasks/task-detail";

interface TaskPageProps {
    params: Promise<{ orgSlug: string; projectId: string; taskId: string }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
    const { orgSlug, projectId, taskId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [taskRes, commentsRes, membersRes, labelsRes, activitiesRes] = await Promise.all([
        supabase
            .from("tasks")
            .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url), reporter:profiles!tasks_reporter_id_fkey(id, full_name, avatar_url), labels:task_labels(labels(id, name, color)), sprint:sprints(id, name)")
            .eq("id", taskId)
            .single(),
        supabase
            .from("comments")
            .select("*, author:profiles(id, full_name, avatar_url)")
            .eq("task_id", taskId)
            .order("created_at", { ascending: true }),
        supabase
            .from("project_members")
            .select("user_id, role, profiles(id, full_name, avatar_url)")
            .eq("project_id", projectId),
        supabase
            .from("labels")
            .select("*")
            .eq("project_id", projectId),
        supabase
            .from("activities")
            .select("*, actor:profiles(full_name, avatar_url)")
            .eq("task_id", taskId)
            .order("created_at", { ascending: false })
            .limit(20),
    ]);

    if (!taskRes.data) notFound();

    return (
        <TaskDetailView
            task={taskRes.data}
            comments={commentsRes.data ?? []}
            members={membersRes.data ?? []}
            labels={labelsRes.data ?? []}
            activities={activitiesRes.data ?? []}
            currentUserId={user.id}
            orgSlug={orgSlug}
            projectId={projectId}
        />
    );
}
