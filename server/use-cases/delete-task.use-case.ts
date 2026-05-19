// ─── Delete Task Use Case ─────────────────────────────────────────────────────

import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { TaskRepository } from "@/lib/db/repositories/task.repository";
import { ProjectRepository } from "@/lib/db/repositories/project.repository";
import { DomainEvents } from "@/lib/domain/events/domain-events";
import { eventPublisher } from "@/lib/domain/events/event-publisher";

export interface DeleteTaskCommand {
    taskId: string;
    requesterId: string;
}

export interface DeleteTaskResult {
    taskId: string;
}

export class DeleteTaskUseCase {
    constructor(
        private readonly taskRepo: TaskRepository,
        private readonly projectRepo: ProjectRepository,
    ) { }

    async execute(cmd: DeleteTaskCommand): Promise<DeleteTaskResult> {
        // Load task — throws NotFoundError if missing
        const task = await this.taskRepo.findByIdOrThrow(cmd.taskId);
        const project = await this.projectRepo.findByIdOrThrow(task.projectId);

        // Authorization: only members with write access can delete tasks
        if (!project.canWrite(cmd.requesterId)) {
            throw new ForbiddenError("You do not have permission to delete this task");
        }

        await this.taskRepo.delete(cmd.taskId);

        await eventPublisher.publish(DomainEvents.taskDeleted({
            taskId: cmd.taskId,
            projectId: task.projectId,
            deletedBy: cmd.requesterId,
        }));

        return { taskId: cmd.taskId };
    }
}
