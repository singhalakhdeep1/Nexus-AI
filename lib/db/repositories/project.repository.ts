// ─── Project Repository ───────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { Project, type ProjectRow } from "@/lib/domain/entities/project.entity";
import { NotFoundError, ConflictError } from "@/lib/domain/errors";

export class ProjectRepository {
    constructor(private readonly db: SupabaseClient<any>) { }

    // ── Queries ───────────────────────────────────────────────────────────────

    async findById(id: string): Promise<Project | null> {
        const { data, error } = await this.db
            .from("projects")
            .select(`
                id, organization_id, owner_id, name, slug, description,
                color, icon, status, created_at, updated_at,
                members:project_members(user_id, role)
            `)
            .eq("id", id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return null;
        return Project.fromRow(data as ProjectRow);
    }

    async findByIdOrThrow(id: string): Promise<Project> {
        const project = await this.findById(id);
        if (!project) throw new NotFoundError("Project");
        return project;
    }

    async findBySlug(slug: string): Promise<Project | null> {
        const { data, error } = await this.db
            .from("projects")
            .select(`
                id, organization_id, owner_id, name, slug, description,
                color, icon, status, created_at, updated_at,
                members:project_members(user_id, role)
            `)
            .eq("slug", slug)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return null;
        return Project.fromRow(data as ProjectRow);
    }

    async findByOrganization(organizationId: string, userId: string): Promise<Project[]> {
        const { data, error } = await this.db
            .from("project_members")
            .select(`
                project:projects(
                    id, organization_id, owner_id, name, slug, description,
                    color, icon, status, created_at, updated_at,
                    members:project_members(user_id, role)
                )
            `)
            .eq("user_id", userId)
            .eq("projects.organization_id", organizationId);

        if (error) throw new Error(error.message);
        return (data ?? [])
            .map((row: any) => row.project)
            .filter(Boolean)
            .map((row: ProjectRow) => Project.fromRow(row));
    }

    async slugExists(slug: string, organizationId: string): Promise<boolean> {
        const { count } = await this.db
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("slug", slug)
            .eq("organization_id", organizationId);
        return (count ?? 0) > 0;
    }

    // ── Commands ──────────────────────────────────────────────────────────────

    async save(project: Project): Promise<void> {
        const row = project.toRow();
        const { error } = await this.db
            .from("projects")
            .upsert({ ...row, created_at: project.createdAt.toISOString() });
        if (error) {
            if (error.code === "23505") throw new ConflictError("Project slug already taken in this organization");
            throw new Error(error.message);
        }
    }

    async addMember(projectId: string, userId: string, role: string): Promise<void> {
        const { error } = await this.db
            .from("project_members")
            .insert({ project_id: projectId, user_id: userId, role });
        if (error) throw new Error(error.message);
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.db
            .from("projects")
            .delete()
            .eq("id", id);
        if (error) throw new Error(error.message);
    }
}
