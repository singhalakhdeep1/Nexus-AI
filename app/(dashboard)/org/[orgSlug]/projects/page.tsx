import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsView } from "@/components/projects/projects-view";

interface ProjectsPageProps {
    params: Promise<{ orgSlug: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
    const { orgSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("slug", orgSlug)
        .single();
    if (!org) redirect("/");

    const { data: projects } = await supabase
        .from("projects")
        .select("*, project_stats(*)")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });

    return <ProjectsView projects={projects ?? []} orgId={org.id} orgSlug={orgSlug} />;
}
