// ─── Move Task Use Case (CQRS Command) ───────────────────────────────────────
// Moves a task from one status to another.
// Enforces transition rules via the Task domain entity.

import { TaskStatus } from "@/lib/domain/value-objects/task-status";
import { DomainEvents } from "@/lib/domain/events/domain-events";
import { eventPublisher } from "@/lib/domain/events/event-publisher";
import { ForbiddenError } from "@/lib/domain/errors";
import type { TaskRepository } from "@/lib/db/repositories/task.repository";
import type { ProjectRepository } from "@/lib/db/repositories/project.repository";
import type { Task } from "@/lib/domain/entities/task.entity";

export interface MoveTaskCommand {
    taskId: string;
    toStatus: string;
    requesterId: string;
}

export interface MoveTaskResult {
    task: Task;
}

export class MoveTaskUseCase {
    constructor(
        private readonly taskRepo: TaskRepository,
        private readonly projectRepo: ProjectRepository,
    ) { }

    async execute(cmd: MoveTaskCommand): Promise<MoveTaskResult> {
        // 1. Load task
        const task = await this.taskRepo.findByIdOrThrow(cmd.taskId);

        // 2. Authorization
        const project = await this.projectRepo.findByIdOrThrow(task.projectId);
        if (!project.canWrite(cmd.requesterId)) {
            throw new ForbiddenError("You do not have permission to update tasks in this project");
        }

        // 3. Domain: move — TaskStatus validates the transition
        const fromStatus = task.status.value;
        const newStatus = TaskStatus.of(cmd.toStatus);
        const updatedTask = task.moveTo(newStatus);

        // 4. Persist — only update status column for efficiency
        await this.taskRepo.updateStatus(updatedTask.id, updatedTask.status.value, updatedTask.updatedAt);

        // 5. Publish event
        await eventPublisher.publish(DomainEvents.taskMoved({
            taskId: task.id,
            projectId: task.projectId,
            fromStatus,
            toStatus: cmd.toStatus,
            movedBy: cmd.requesterId,
        }));

        return { task: updatedTask };
    }
}
