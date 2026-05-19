"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceUser {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    online_at: string;
}

export function usePresence(channelName: string, currentUser: { id: string; full_name: string; avatar_url?: string } | null) {
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
    const supabase = createClient();
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase.channel(channelName, {
            config: { presence: { key: currentUser.id } },
        });

        channelRef.current = channel;

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState<PresenceUser>();
                const users: PresenceUser[] = [];
                for (const [key, presences] of Object.entries(state)) {
                    const latest = (presences as PresenceUser[])[0];
                    if (latest) users.push(latest);
                }
                setOnlineUsers(users);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        user_id: currentUser.id,
                        full_name: currentUser.full_name,
                        avatar_url: currentUser.avatar_url,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
        };
    }, [channelName, currentUser?.id]);

    return { onlineUsers };
}
