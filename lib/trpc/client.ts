import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers";

/**
 * tRPC React client — import `trpc` anywhere in client components.
 *
 * Usage:
 *   const { data } = trpc.tasks.list.useQuery({ projectId });
 *   const mutation = trpc.tasks.create.useMutation();
 */
export const trpc = createTRPCReact<AppRouter>();
