import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { renderInviteEmail } from "@/lib/email/templates";
import { z } from "zod";

const bodySchema = z.object({
    email: z.string().email(),
    role: z.enum(["member", "admin"]),
    orgId: z.string().uuid(),
    orgName: z.string(),
    orgSlug: z.string(),
});

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { email, role, orgId, orgName, orgSlug } = parsed.data;

    // Verify requester is admin/owner
    const { data: memberRow } = await supabase
        .from("organization_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();

    if (!memberRow || !["owner", "admin"].includes(memberRow.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get inviter profile
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const inviterName = profile?.full_name ?? "A teammate";

    // Generate magic link via Supabase
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=/org/${orgSlug}`,
        },
    });

    if (linkError || !linkData.properties?.action_link) {
        return NextResponse.json({ error: "Failed to generate invite link" }, { status: 500 });
    }

    const { subject, html, text } = renderInviteEmail({
        orgName,
        orgSlug,
        inviterName,
        role,
        inviteUrl: linkData.properties.action_link,
    });

    const { error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject,
        html,
        text,
    });

    if (emailError) {
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
