import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/**
 * Liveblocks auth endpoint.
 * Issues a token scoped to the requested room (project Kanban board).
 * Room format: "project:<projectId>"
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { room } = await req.json();
    if (!room) return new Response("room required", { status: 400 });

    // Verify user has access to the project
    const projectId = room.replace("project:", "");
    const { data: member } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single();

    if (!member) return new Response("Forbidden", { status: 403 });

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

    // Issue token with user metadata — shown in live cursors
    const { body, status } = await liveblocks.identifyUser(
        {
            userId: user.id,
            groupIds: [projectId],
        },
        {
            userInfo: {
                name: profile?.full_name ?? user.email ?? "Anonymous",
                avatar: profile?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name ?? "User")}`,
                color: generateUserColor(user.id),
            },
        }
    );

    return new Response(body, { status });
}

/** Deterministic color from user ID — consistent across sessions */
function generateUserColor(userId: string): string {
    const colors = [
        "#ef4444", "#f97316", "#eab308", "#22c55e",
        "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
    ];
    const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
}
