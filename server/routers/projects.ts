// ─── Projects Router ───────────────────────────────────────────────────────────
// Thin presentation layer. Delegates reads to ProjectQueries, writes to use cases.

import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { ProjectRepository } from "@/lib/db/repositories/project.repository";
import { TaskRepository } from "@/lib/db/repositories/task.repository";
import { ProjectQueries } from "@/server/queries/project.queries";
import { TaskQueries } from "@/server/queries/task.queries";
import { CreateProjectUseCase } from "@/server/use-cases/create-project.use-case";
import { DomainError, ForbiddenError, NotFoundError, ValidationError, ConflictError } from "@/lib/domain/errors";

function mapDomainError(err: unknown): never {
    if (err instanceof ForbiddenError) throw new TRPCError({ code: "FORBIDDEN", message: err.message });
    if (err instanceof NotFoundError) throw new TRPCError({ code: "NOT_FOUND", message: err.message });
    if (err instanceof ValidationError) throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
    if (err instanceof ConflictError) throw new TRPCError({ code: "CONFLICT", message: err.message });
    if (err instanceof DomainError) throw new TRPCError({ code: "UNPROCESSABLE_CONTENT", message: err.message });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
}

export const projectsRouter = router({

    // ── QUERIES ──────────────────────────────────────────────────────────────

    /** All projects in an organization visible to the current user */
    list: protectedProcedure
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new ProjectQueries(ctx.supabase);
                return await queries.listForOrganization(input.orgId, ctx.user.id);
            } catch (err) { return mapDomainError(err); }
        }),

    /** Single project by slug */
    bySlug: protectedProcedure
        .input(z.object({ slug: z.string(), orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new ProjectQueries(ctx.supabase);
                const project = await queries.getBySlug(input.slug, input.orgId, ctx.user.id);
                if (!project) throw new TRPCError({ code: "NOT_FOUND" });
                return project;
            } catch (err) { return mapDomainError(err); }
        }),

    /** List members of a project */
    members: protectedProcedure
        .input(z.object({ projectId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new ProjectQueries(ctx.supabase);
                return await queries.getMembers(input.projectId);
            } catch (err) { return mapDomainError(err); }
        }),

    /** Task analytics for a project */
    analytics: protectedProcedure
        .input(z.object({ projectId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            try {
                const queries = new TaskQueries(ctx.supabase);
                return await queries.getProjectAnalytics(input.projectId);
            } catch (err) { return mapDomainError(err); }
        }),

    // ── COMMANDS ─────────────────────────────────────────────────────────────

    /** Create project — delegates to CreateProjectUseCase */
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(100),
            slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
            description: z.string().max(1000).optional(),
            orgId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const useCase = new CreateProjectUseCase(new ProjectRepository(ctx.supabase));
                const result = await useCase.execute({ ...input, organizationId: input.orgId, requesterId: ctx.user.id });
                return result.project.toRow();
            } catch (err) { return mapDomainError(err); }
        }),

    /** Archive project */
    archive: protectedProcedure
        .input(z.object({ projectId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            try {
                const projectRepo = new ProjectRepository(ctx.supabase);
                const project = await projectRepo.findByIdOrThrow(input.projectId);

                project.archive(ctx.user.id);  // throws ForbiddenError if not owner/admin
                await projectRepo.save(project);

                return { success: true };
            } catch (err) { return mapDomainError(err); }
        }),
});
