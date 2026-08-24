import { router } from "@/server/trpc";
import { tasksRouter } from "./tasks";
import { projectsRouter } from "./projects";
import { authRouter } from "./auth";

/**
 * Root tRPC router — combine all sub-routers here.
 * Adding a new domain: create server/routers/<domain>.ts, import, add below.
 */
export const appRouter = router({
    tasks: tasksRouter,
    projects: projectsRouter,
    auth: authRouter,
});

export type AppRouter = typeof appRouter;
