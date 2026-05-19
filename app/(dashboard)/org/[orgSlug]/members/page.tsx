import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MembersView } from "@/components/members/members-view";

interface MembersPageProps {
    params: Promise<{ orgSlug: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
    const { orgSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [orgRes, membersRes, profileRes] = await Promise.all([
        supabase.from("organizations").select("id, name, slug").eq("slug", orgSlug).single(),
        supabase
            .from("organization_members")
            .select("user_id, role, created_at, profiles(id, full_name, avatar_url, email)")
            .order("created_at", { ascending: true }),
        supabase.from("profiles").select("id").eq("id", user.id).single(),
    ]);

    if (!orgRes.data) redirect("/");

    // Verify membership
    const isMember = membersRes.data?.some((m) => m.user_id === user.id);
    if (!isMember) redirect("/");

    const currentMember = membersRes.data?.find((m) => m.user_id === user.id);

    return (
        <MembersView
            org={orgRes.data}
            members={membersRes.data ?? []}
            currentUserId={user.id}
            currentUserRole={currentMember?.role ?? "member"}
        />
    );
}
