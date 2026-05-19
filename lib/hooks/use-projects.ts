"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Project, CreateProjectInput } from "@/types";
import { generateSlug } from "@/lib/utils";

const supabase = createClient();

// ── Query Keys ─────────────────────────────────────────────
export const projectKeys = {
    all: (orgId: string) => ["projects", orgId] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
    stats: (orgId: string) => ["projects", "stats", orgId] as const,
};

// ── Fetch projects for an organization ─────────────────────
export function useProjects(orgId: string) {
    return useQuery({
        queryKey: projectKeys.all(orgId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select(`
          *,
          stats:project_stats(*)
        `)
                .eq("organization_id", orgId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Project[];
        },
        staleTime: 1000 * 60 * 2, // 2 min
        enabled: !!orgId,
    });
}

// ── Fetch single project ───────────────────────────────────
export function useProject(projectId: string) {
    return useQuery({
        queryKey: projectKeys.detail(projectId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select(`
          *,
          stats:project_stats(*),
          created_by_profile:profiles!projects_created_by_fkey(id, full_name, avatar_url)
        `)
                .eq("id", projectId)
                .single();

            if (error) throw error;
            return data as Project;
        },
        enabled: !!projectId,
    });
}

// ── Create project ─────────────────────────────────────────
export function useCreateProject(orgId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateProjectInput) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("projects")
                .insert({
                    organization_id: orgId,
                    created_by: user.id,
                    ...input,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all(orgId) });
        },
    });
}

// ── Update project ─────────────────────────────────────────
export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
            const { data, error } = await supabase
                .from("projects")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Project;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: projectKeys.all(data.organization_id) });
        },
    });
}

// ── Delete project ─────────────────────────────────────────
export function useDeleteProject(orgId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", projectId);

            if (error) throw error;
            return projectId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all(orgId) });
        },
    });
}
