// ─── Project Entity ───────────────────────────────────────────────────────────
// Business rules for Project aggregate.

import { ValidationError, ForbiddenError } from "@/lib/domain/errors";

export type ProjectStatusValue = "active" | "archived" | "completed";
export type MemberRoleValue = "owner" | "admin" | "member" | "viewer";

export interface ProjectMemberInfo {
    userId: string;
    role: MemberRoleValue;
}

export interface ProjectProps {
    id: string;
    organizationId: string;
    ownerId: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    icon: string;
    status: ProjectStatusValue;
    members: ProjectMemberInfo[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProjectInput {
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    createdBy: string;
}

export interface ProjectRow {
    id: string;
    organization_id: string;
    owner_id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    icon: string;
    status: string;
    created_at: string;
    updated_at: string;
    members?: Array<{ user_id: string; role: string }>;
}

export class Project {
    private constructor(private readonly props: ProjectProps) { }

    get id() { return this.props.id; }
    get organizationId() { return this.props.organizationId; }
    get ownerId() { return this.props.ownerId; }
    get name() { return this.props.name; }
    get slug() { return this.props.slug; }
    get description() { return this.props.description; }
    get color() { return this.props.color; }
    get icon() { return this.props.icon; }
    get status() { return this.props.status; }
    get members() { return this.props.members; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    static create(input: CreateProjectInput): Project {
        if (!input.name?.trim()) throw new ValidationError("Project name cannot be empty");
        if (input.name.trim().length > 100) throw new ValidationError("Project name cannot exceed 100 characters");
        if (!/^[a-z0-9-]+$/.test(input.slug)) throw new ValidationError("Slug must be lowercase letters, numbers, or hyphens");

        const now = new Date();
        return new Project({
            id: crypto.randomUUID(),
            organizationId: input.organizationId,
            ownerId: input.createdBy,
            name: input.name.trim(),
            slug: input.slug,
            description: input.description?.trim() ?? null,
            color: input.color ?? "#6366f1",
            icon: input.icon ?? "folder",
            status: "active",
            members: [{ userId: input.createdBy, role: "owner" }],
            createdAt: now,
            updatedAt: now,
        });
    }

    static fromRow(row: ProjectRow): Project {
        return new Project({
            id: row.id,
            organizationId: row.organization_id,
            ownerId: row.owner_id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            color: row.color,
            icon: row.icon,
            status: row.status as ProjectStatusValue,
            members: (row.members ?? []).map(m => ({
                userId: m.user_id,
                role: m.role as MemberRoleValue,
            })),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }

    // ── Business rules ────────────────────────────────────────────────────────

    /** Returns true if the user has any role in this project */
    isMember(userId: string): boolean {
        return this.props.members.some(m => m.userId === userId);
    }

    /** Returns true if user can perform write operations (not viewer) */
    canWrite(userId: string): boolean {
        const member = this.props.members.find(m => m.userId === userId);
        if (!member) return false;
        return ["owner", "admin", "member"].includes(member.role);
    }

    /** Only owner and admin can manage members */
    canManageMembers(userId: string): boolean {
        const member = this.props.members.find(m => m.userId === userId);
        return member?.role === "owner" || member?.role === "admin";
    }

    /** Business rule: cannot archive a project that has active sprints */
    archive(requesterId: string): Project {
        if (!this.canManageMembers(requesterId)) throw new ForbiddenError("Only admins and owners can archive projects");
        if (this.props.status === "archived") throw new ValidationError("Project is already archived");

        return new Project({ ...this.props, status: "archived", updatedAt: new Date() });
    }

    toRow(): Omit<ProjectRow, "created_at"> & { updated_at: string } {
        return {
            id: this.props.id,
            organization_id: this.props.organizationId,
            owner_id: this.props.ownerId,
            name: this.props.name,
            slug: this.props.slug,
            description: this.props.description,
            color: this.props.color,
            icon: this.props.icon,
            status: this.props.status,
            updated_at: this.props.updatedAt.toISOString(),
        };
    }
}
