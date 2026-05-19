import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Sprint } from "@/types";

const sprintKeys = {
    all: ["sprints"] as const,
    byProject: (projectId: string) => ["sprints", projectId] as const,
};

export function useSprints(projectId: string) {
    const supabase = createClient();
    return useQuery({
        queryKey: sprintKeys.byProject(projectId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("sprints")
                .select("*")
                .eq("project_id", projectId)
                .order("start_date", { ascending: false });
            if (error) throw error;
            return data as Sprint[];
        },
        enabled: !!projectId,
    });
}

export function useCreateSprint(projectId: string) {
    const supabase = createClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: { name: string; goal?: string; start_date?: string; end_date?: string }) => {
            const { data, error } = await supabase
                .from("sprints")
                .insert({ ...input, project_id: projectId, status: "planned" })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) }),
    });
}

export function useUpdateSprint(projectId: string) {
    const supabase = createClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Sprint> & { id: string }) => {
            const { data, error } = await supabase
                .from("sprints")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) }),
    });
}

export function useDeleteSprint(projectId: string) {
    const supabase = createClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (sprintId: string) => {
            const { error } = await supabase.from("sprints").delete().eq("id", sprintId);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) }),
    });
}
