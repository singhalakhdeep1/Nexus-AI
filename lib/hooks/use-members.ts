"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { OrganizationMember, Profile, Notification } from "@/types";

const supabase = createClient();

// ── Fetch org members ──────────────────────────────────────
export function useOrgMembers(orgId: string) {
    return useQuery({
        queryKey: ["org-members", orgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("organization_members")
                .select(`
          *,
          profile:profiles(id, full_name, avatar_url, username, bio)
        `)
                .eq("organization_id", orgId)
                .order("joined_at", { ascending: true });

            if (error) throw error;
            return data as OrganizationMember[];
        },
        staleTime: 1000 * 60 * 5, // 5 min
        enabled: !!orgId,
    });
}

// ── Fetch current user's notifications ────────────────────
export function useNotifications(userId: string) {
    return useQuery({
        queryKey: ["notifications", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select(`*, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)`)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as Notification[];
        },
        staleTime: 1000 * 30,
        enabled: !!userId,
    });
}

// ── Fetch activity feed ────────────────────────────────────
export function useActivityFeed(orgId: string, projectId?: string) {
    return useQuery({
        queryKey: ["activities", orgId, projectId],
        queryFn: async () => {
            let query = supabase
                .from("activities")
                .select(`
          *,
          actor:profiles!activities_actor_id_fkey(id, full_name, avatar_url)
        `)
                .eq("organization_id", orgId)
                .order("created_at", { ascending: false })
                .limit(30);

            if (projectId) {
                query = query.eq("project_id", projectId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 30,
        enabled: !!orgId,
    });
}
