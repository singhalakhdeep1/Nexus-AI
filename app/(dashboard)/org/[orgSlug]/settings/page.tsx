import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { OrgSettings } from "@/components/settings/org-settings";
import { BillingSettings } from "@/components/settings/billing-settings";

interface SettingsPageProps {
    params: Promise<{ orgSlug: string }>;
    searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
    const { orgSlug } = await params;
    const { tab = "profile" } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [orgRes, profileRes, memberRes] = await Promise.all([
        supabase.from("organizations").select("*").eq("slug", orgSlug).single(),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("organization_members").select("role").eq("org_id", (await supabase.from("organizations").select("id").eq("slug", orgSlug).single()).data?.id ?? "").eq("user_id", user.id).single(),
    ]);

    if (!orgRes.data) redirect("/");

    const isAdmin = memberRes.data?.role === "owner" || memberRes.data?.role === "admin";

    return (
        <div className="p-6 max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your profile and organization settings</p>
            </div>

            <Tabs defaultValue={tab}>
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    {isAdmin && <TabsTrigger value="organization">Organization</TabsTrigger>}
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <ProfileSettings profile={profileRes.data} />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="organization" className="mt-6">
                        <OrgSettings org={orgRes.data} currentUserRole={memberRes.data?.role ?? "member"} />
                    </TabsContent>
                )}

                <TabsContent value="billing" className="mt-6">
                    <BillingSettings org={orgRes.data} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
