import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsView } from "@/components/notifications/notifications-view";

interface NotificationsPageProps {
    params: Promise<{ orgSlug: string }>;
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
    const { orgSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const notificationsRes = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <NotificationsView
            notifications={notificationsRes.data ?? []}
            userId={user.id}
            orgSlug={orgSlug}
        />
    );
}
