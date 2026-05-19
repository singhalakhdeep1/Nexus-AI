// ─── Create Project Use Case ──────────────────────────────────────────────────

import { Project } from "@/lib/domain/entities/project.entity";
import { DomainEvents } from "@/lib/domain/events/domain-events";
import { eventPublisher } from "@/lib/domain/events/event-publisher";
import { ConflictError } from "@/lib/domain/errors";
import type { ProjectRepository } from "@/lib/db/repositories/project.repository";

export interface CreateProjectCommand {
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    requesterId: string;
}

export class CreateProjectUseCase {
    constructor(private readonly projectRepo: ProjectRepository) { }

    async execute(cmd: CreateProjectCommand): Promise<{ project: Project }> {
        // Business rule: slug must be unique within the organization
        const slugTaken = await this.projectRepo.slugExists(cmd.slug, cmd.organizationId);
        if (slugTaken) throw new ConflictError(`Slug "${cmd.slug}" is already taken in this organization`);

        // Domain entity creation (validates name, slug format)
        const project = Project.create({
            organizationId: cmd.organizationId,
            name: cmd.name,
            slug: cmd.slug,
            description: cmd.description,
            color: cmd.color,
            icon: cmd.icon,
            createdBy: cmd.requesterId,
        });

        await this.projectRepo.save(project);
        await this.projectRepo.addMember(project.id, cmd.requesterId, "owner");

        await eventPublisher.publish(DomainEvents.projectCreated({
            projectId: project.id,
            organizationId: project.organizationId,
            name: project.name,
            createdBy: project.ownerId,
        }));

        return { project };
    }
}
