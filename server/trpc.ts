import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * tRPC context — created per request.
 * Attaches the authenticated Supabase user so every router can gate access.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return {
        supabase,
        user,
        headers: opts.headers,
    };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Middleware that enforces authentication */
const enforceAuth = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
export const createCallerFactory = t.createCallerFactory;
