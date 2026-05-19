// ─── Create Task Use Case ─────────────────────────────────────────────────────
// The use case orchestrates domain + infrastructure.
// It does NOT know about HTTP, tRPC, or Next.js.
// It DOES know about: domain entities, repositories, domain events.
//
// Sequence:
//   1. Authorize: is the user a member who can write?
//   2. Domain: create the Task entity (business rules enforced)
//   3. Persist: save via repository
//   4. Publish: emit domain event for side effects

import { Task } from "@/lib/domain/entities/task.entity";
import { DomainEvents } from "@/lib/domain/events/domain-events";
import { eventPublisher } from "@/lib/domain/events/event-publisher";
import { ForbiddenError } from "@/lib/domain/errors";
import type { TaskRepository } from "@/lib/db/repositories/task.repository";
import type { ProjectRepository } from "@/lib/db/repositories/project.repository";

export interface CreateTaskCommand {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: Date;
    position?: number;
    requesterId: string;  // the authenticated user
}

export interface CreateTaskResult {
    task: Task;
}

export class CreateTaskUseCase {
    constructor(
        private readonly taskRepo: TaskRepository,
        private readonly projectRepo: ProjectRepository,
    ) { }

    async execute(cmd: CreateTaskCommand): Promise<CreateTaskResult> {
        // 1. Authorization: verify user can write to this project
        const project = await this.projectRepo.findByIdOrThrow(cmd.projectId);
        if (!project.canWrite(cmd.requesterId)) {
            throw new ForbiddenError("You do not have permission to create tasks in this project");
        }

        // 2. Domain: create entity — business rules are enforced inside Task.create
        const task = Task.create({
            projectId: cmd.projectId,
            title: cmd.title,
            description: cmd.description,
            priority: cmd.priority,
            assigneeId: cmd.assigneeId,
            dueDate: cmd.dueDate,
            position: cmd.position,
            createdBy: cmd.requesterId,
        });

        // 3. Persist via repository
        await this.taskRepo.save(task);

        // 4. Publish domain event — Liveblocks handler, analytics, notifications react
        await eventPublisher.publish(DomainEvents.taskCreated({
            taskId: task.id,
            projectId: task.projectId,
            title: task.title,
            createdBy: task.createdBy,
            assigneeId: task.assigneeId,
            priority: task.priority.value,
        }));

        return { task };
    }
}
