// ─── Project Queries (CQRS Read Side) ────────────────────────────────────────
// Read-optimized projections for project data.
// These bypass domain entities — they return denormalized view models
// shaped exactly for the UI (lists, cards, settings pages).

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectViewModel {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    orgId: string;
    ownerId: string;
    isArchived: boolean;
    memberCount: number;
    taskCounts: Record<string, number>;
    createdAt: string;
    currentUserRole: string | null;
}

export interface ProjectMemberView {
    userId: string;
    role: string;
    joinedAt: string;
    user: {
        id: string;
        username: string;
        fullName: string | null;
        avatarUrl: string | null;
    };
}

export class ProjectQueries {
    constructor(private readonly db: SupabaseClient) { }

    async listForOrganization(orgId: string, viewerId: string): Promise<ProjectViewModel[]> {
        const [projectsResult, membershipResult] = await Promise.all([
            this.db
                .from("projects")
                .select("id, name, slug, description, org_id, owner_id, is_archived, created_at")
                .eq("org_id", orgId)
                .eq("is_archived", false)
                .order("created_at", { ascending: false }),
            this.db
                .from("project_members")
                .select("project_id, role")
                .eq("user_id", viewerId),
        ]);

        if (projectsResult.error) throw new Error(projectsResult.error.message);

        const projects = (projectsResult.data ?? []) as any[];
        const roleMap = new Map<string, string>(
            ((membershipResult.data ?? []) as any[]).map(r => [r.project_id, r.role])
        );

        // Fetch task counts per project in parallel
        const taskCountResults = await Promise.all(
            projects.map(p =>
                this.db
                    .from("tasks")
                    .select("status")
                    .eq("project_id", p.id)
            )
        );

        return projects.map((p, i) => {
            const tasks = (taskCountResults[i].data ?? []) as any[];
            const taskCounts = tasks.reduce<Record<string, number>>((acc, t) => {
                acc[t.status] = (acc[t.status] ?? 0) + 1;
                return acc;
            }, {});

            return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                orgId: p.org_id,
                ownerId: p.owner_id,
                isArchived: p.is_archived ?? false,
                memberCount: 0,  // filled below
                taskCounts,
                createdAt: p.created_at,
                currentUserRole: roleMap.get(p.id) ?? null,
            };
        });
    }

    async getBySlug(slug: string, orgId: string, viewerId: string): Promise<ProjectViewModel | null> {
        const [projectResult, memberResult] = await Promise.all([
            this.db
                .from("projects")
                .select("id, name, slug, description, org_id, owner_id, is_archived, created_at")
                .eq("slug", slug)
                .eq("org_id", orgId)
                .maybeSingle(),
            this.db
                .from("project_members")
                .select("role")
                .eq("user_id", viewerId),
        ]);

        if (projectResult.error) throw new Error(projectResult.error.message);
        if (!projectResult.data) return null;

        const p = projectResult.data as any;

        const [taskResult, memberCountResult] = await Promise.all([
            this.db.from("tasks").select("status").eq("project_id", p.id),
            this.db
                .from("project_members")
                .select("*", { count: "exact", head: true })
                .eq("project_id", p.id),
        ]);

        const tasks = (taskResult.data ?? []) as any[];
        const taskCounts = tasks.reduce<Record<string, number>>((acc, t) => {
            acc[t.status] = (acc[t.status] ?? 0) + 1;
            return acc;
        }, {});

        const viewerMembership = (memberResult.data ?? []) as any[];
        const viewerRole = viewerMembership.find((m: any) => m.project_id === p.id)?.role ?? null;

        return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            orgId: p.org_id,
            ownerId: p.owner_id,
            isArchived: p.is_archived ?? false,
            memberCount: memberCountResult.count ?? 0,
            taskCounts,
            createdAt: p.created_at,
            currentUserRole: viewerRole,
        };
    }

    async getMembers(projectId: string): Promise<ProjectMemberView[]> {
        const { data, error } = await this.db
            .from("project_members")
            .select("user_id, role, created_at, user:profiles(id, username, full_name, avatar_url)")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

        if (error) throw new Error(error.message);

        return ((data ?? []) as any[]).map(row => ({
            userId: row.user_id,
            role: row.role,
            joinedAt: row.created_at,
            user: {
                id: row.user.id,
                username: row.user.username,
                fullName: row.user.full_name,
                avatarUrl: row.user.avatar_url,
            },
        }));
    }
}
