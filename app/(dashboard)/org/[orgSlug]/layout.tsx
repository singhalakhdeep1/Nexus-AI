import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgShell } from "@/components/layout/org-shell";

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { orgSlug } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch org by slug + verify membership
    const { data: org } = await supabase
        .from("organizations")
        .select("*, organization_members!inner(user_id, role)")
        .eq("slug", orgSlug)
        .eq("organization_members.user_id", user.id)
        .single();

    if (!org) redirect("/");

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch projects for sidebar
    const { data: projects } = await supabase
        .from("projects")
        .select("id, name, identifier, color, icon, status")
        .eq("organization_id", org.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(20);

    return (
        <OrgShell
            org={org}
            profile={profile}
            projects={projects ?? []}
            orgSlug={orgSlug}
        >
            {children}
        </OrgShell>
    );
}
