"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { taskKeys } from "./use-tasks";

// ── Real-time task updates for a project ──────────────────
export function useRealtimeTasks(projectId: string) {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!projectId) return;

        // Unsubscribe previous channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`tasks:project:${projectId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `project_id=eq.${projectId}`,
                },
                (payload) => {
                    // Invalidate and refetch tasks on any change
                    queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });

                    if (payload.eventType === "UPDATE" && payload.new.id) {
                        queryClient.invalidateQueries({
                            queryKey: taskKeys.detail(payload.new.id as string),
                        });
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, queryClient, supabase]);
}

// ── Real-time notifications ────────────────────────────────
export function useRealtimeNotifications(userId: string, onNew: () => void) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!userId) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`notifications:user:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    onNew();
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, onNew, supabase]);
}
