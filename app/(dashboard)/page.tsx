import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Find first org for this user
    const { data: membership } = await supabase
        .from("organization_members")
        .select("organizations(slug)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    const orgSlug = (membership?.organizations as any)?.slug;
    if (orgSlug) redirect(`/org/${orgSlug}`);

    // First time user — no org yet, redirect to onboarding
    redirect("/onboarding");
}
