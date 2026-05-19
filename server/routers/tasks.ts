// ─── Tasks Router ─────────────────────────────────────────────────────────────
// This tRPC router is the PRESENTATION layer in Clean Architecture.
// Its only job: parse input, call the correct use case or query, map errors.
// NO business logic lives here. All business rules live in the domain layer.

import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { TaskRepository } from "@/lib/db/repositories/task.repository";
import { ProjectRepository } from "@/lib/db/repositories/project.repository";
import { TaskQueries } from "@/server/queries/task.queries";
import { CreateTaskUseCase } from "@/server/use-cases/create-task.use-case";
import { MoveTaskUseCase } from "@/server/use-cases/move-task.use-case";
import { UpdateTaskUseCase } from "@/server/use-cases/update-task.use-case";
import { DomainError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { DomainEvents } from "@/lib/domain/events/domain-events";
import { eventPublisher } from "@/lib/domain/events/event-publisher";

/** Maps domain errors → tRPC errors. Single place for this translation. */
function mapDomainError(err: unknown): never {
    if (err instanceof ForbiddenError) throw new TRPCError({ code: "FORBIDDEN", message: err.message });
    if (err instanceof NotFoundError) throw new TRPCError({ code: "NOT_FOUND", message: err.message });
    if (err instanceof ValidationError) throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
    if (err instanceof DomainError) throw new TRPCError({ code: "UNPROCESSABLE_CONTENT", message: err.message });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
}

export const tasksRouter = router({
    // ── QUERIES (Read side — CQRS) ─────────────────────────────────────────────

    /** List tasks — uses the CQRS TaskQueries read model (not domain entities) */
    list: protectedProcedure
        .input(z.object({
            projectId: z.string().uuid(),
            status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
            assigneeId: z.string().uuid().optional(),
            cursor: z.number().optional(),
            limit: z.number().min(1).max(100).default(50),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new TaskQueries(ctx.supabase);
                return await queries.list({
                    projectId: input.projectId,
                    status: input.status,
                    assigneeId: input.assigneeId,
                    cursor: input.cursor,
                    limit: input.limit,
                });
            } catch (err) { return mapDomainError(err); }
        }),

    /** Single task by ID */
    byId: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new TaskQueries(ctx.supabase);
                const task = await queries.getById(input.id);
                if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
                return task;
            } catch (err) { return mapDomainError(err); }
        }),

    /** Analytics for a project (pure read model, no domain entities) */
    analytics: protectedProcedure
        .input(z.object({ projectId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new TaskQueries(ctx.supabase);
                return await queries.getProjectAnalytics(input.projectId);
            } catch (err) { return mapDomainError(err); }
        }),

    // ── COMMANDS (Write side — CQRS) ───────────────────────────────────────────

    /** Create task — delegates to CreateTaskUseCase */
    create: protectedProcedure
        .input(z.object({
            projectId: z.string().uuid(),
            title: z.string().min(1).max(500),
            description: z.string().max(10000).optional(),
            priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
            assigneeId: z.string().uuid().optional(),
            dueDate: z.coerce.date().optional(),
            position: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const useCase = new CreateTaskUseCase(
                    new TaskRepository(ctx.supabase),
                    new ProjectRepository(ctx.supabase),
                );
                const result = await useCase.execute({ ...input, requesterId: ctx.user.id });
                return result.task.toRow();
            } catch (err) { return mapDomainError(err); }
        }),

    /** Move task to new status — validates state machine transition */
    move: protectedProcedure
        .input(z.object({
            taskId: z.string().uuid(),
            toStatus: z.enum(["todo", "in_progress", "in_review", "done"]),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const useCase = new MoveTaskUseCase(
                    new TaskRepository(ctx.supabase),
                    new ProjectRepository(ctx.supabase),
                );
                const result = await useCase.execute({ ...input, requesterId: ctx.user.id });
                return result.task.toRow();
            } catch (err) { return mapDomainError(err); }
        }),

    /** Update task fields */
    update: protectedProcedure
        .input(z.object({
            taskId: z.string().uuid(),
            title: z.string().min(1).max(500).optional(),
            description: z.string().max(10000).optional(),
            priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
            assigneeId: z.string().uuid().nullable().optional(),
            dueDate: z.coerce.date().nullable().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const useCase = new UpdateTaskUseCase(
                    new TaskRepository(ctx.supabase),
                    new ProjectRepository(ctx.supabase),
                );
                const result = await useCase.execute({ ...input, requesterId: ctx.user.id });
                return result.task.toRow();
            } catch (err) { return mapDomainError(err); }
        }),

    /** Delete task */
    delete: protectedProcedure
        .input(z.object({ taskId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            try {
                const taskRepo = new TaskRepository(ctx.supabase);
                const projectRepo = new ProjectRepository(ctx.supabase);

                const task = await taskRepo.findByIdOrThrow(input.taskId);
                const project = await projectRepo.findByIdOrThrow(task.projectId);

                if (!project.canWrite(ctx.user.id)) {
                    throw new TRPCError({ code: "FORBIDDEN" });
                }

                await taskRepo.delete(input.taskId);

                await eventPublisher.publish(DomainEvents.taskDeleted({
                    taskId: input.taskId,
                    projectId: task.projectId,
                    deletedBy: ctx.user.id,
                }));

                return { success: true };
            } catch (err) { return mapDomainError(err); }
        }),

    /** Batch reorder after Kanban drag-drop — positional updates only */
    reorder: protectedProcedure
        .input(z.array(z.object({
            id: z.string().uuid(),
            position: z.number(),
            status: z.enum(["todo", "in_progress", "in_review", "done"]),
        })))
        .mutation(async ({ ctx, input }) => {
            try {
                const taskRepo = new TaskRepository(ctx.supabase);
                await Promise.all(
                    input.map(({ id, position }) => taskRepo.updatePosition(id, position))
                );
                return { success: true };
            } catch (err) { return mapDomainError(err); }
        }),
});
