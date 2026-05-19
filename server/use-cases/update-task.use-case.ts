// ─── Update Task Use Case ─────────────────────────────────────────────────────

import { DomainEvents } from "@/lib/domain/events/domain-events";
import { eventPublisher } from "@/lib/domain/events/event-publisher";
import { ForbiddenError } from "@/lib/domain/errors";
import type { TaskRepository } from "@/lib/db/repositories/task.repository";
import type { ProjectRepository } from "@/lib/db/repositories/project.repository";
import type { Task } from "@/lib/domain/entities/task.entity";

export interface UpdateTaskCommand {
    taskId: string;
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
    requesterId: string;
}

export class UpdateTaskUseCase {
    constructor(
        private readonly taskRepo: TaskRepository,
        private readonly projectRepo: ProjectRepository,
    ) { }

    async execute(cmd: UpdateTaskCommand): Promise<{ task: Task }> {
        const task = await this.taskRepo.findByIdOrThrow(cmd.taskId);
        const project = await this.projectRepo.findByIdOrThrow(task.projectId);

        if (!project.canWrite(cmd.requesterId)) {
            throw new ForbiddenError("You do not have permission to update tasks in this project");
        }

        // Track changes for the domain event
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        if (cmd.title !== undefined && cmd.title !== task.title) changes.title = { from: task.title, to: cmd.title };
        if (cmd.description !== undefined && cmd.description !== task.description) changes.description = { from: task.description, to: cmd.description };
        if (cmd.priority !== undefined && cmd.priority !== task.priority.value) changes.priority = { from: task.priority.value, to: cmd.priority };
        if (cmd.assigneeId !== undefined && cmd.assigneeId !== task.assigneeId) changes.assigneeId = { from: task.assigneeId, to: cmd.assigneeId };

        const updatedTask = task.update({
            title: cmd.title,
            description: cmd.description,
            priority: cmd.priority,
            assigneeId: cmd.assigneeId,
            dueDate: cmd.dueDate,
        });

        await this.taskRepo.save(updatedTask);

        if (Object.keys(changes).length > 0) {
            await eventPublisher.publish(DomainEvents.taskUpdated({
                taskId: task.id,
                projectId: task.projectId,
                updatedBy: cmd.requesterId,
                changes,
            }));
        }

        return { task: updatedTask };
    }
}
