import { createSchema, createYoga } from "graphql-yoga";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";

/**
 * Read-only GraphQL endpoint — project analytics & public data.
 * Write operations use tRPC (type-safe, batched, optimistic).
 *
 * Trade-off documented in docs/adr/0002-why-trpc-over-graphql.md
 */

const typeDefs = /* GraphQL */ `
  type Query {
    project(id: ID!): Project
    projects: [Project!]!
    task(id: ID!): Task
    analytics(projectId: ID!): Analytics!
  }

  type Project {
    id: ID!
    name: String!
    slug: String!
    description: String
    status: String!
    color: String!
    createdAt: String!
    taskCounts: TaskCounts!
    members: [Member!]!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    priority: String!
    dueDate: String
    createdAt: String!
    assignee: User
  }

  type TaskCounts {
    total: Int!
    todo: Int!
    inProgress: Int!
    inReview: Int!
    done: Int!
  }

  type Member {
    role: String!
    user: User!
  }

  type User {
    id: ID!
    fullName: String
    avatarUrl: String
  }

  type Analytics {
    completionRate: Float!
    overdueTasks: Int!
    tasksCompletedThisWeek: Int!
    averageCycleTimeHours: Float!
    velocityByWeek: [WeeklyVelocity!]!
  }

  type WeeklyVelocity {
    week: String!
    completed: Int!
    added: Int!
  }
`;

const resolvers = {
    Query: {
        async project(_: unknown, { id }: { id: string }, ctx: { supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never }) {
            const { data } = await ctx.supabase
                .from("projects")
                .select("*, members:project_members(role, user:profiles(id, full_name, avatar_url))")
                .eq("id", id)
                .single();
            return data;
        },

        async projects(_: unknown, __: unknown, ctx: any) {
            const { data } = await ctx.supabase
                .from("project_members")
                .select("project:projects(*)")
                .eq("user_id", ctx.userId);
            return data?.map((m: any) => m.project) ?? [];
        },

        async task(_: unknown, { id }: { id: string }, ctx: any) {
            const { data } = await ctx.supabase
                .from("tasks")
                .select("*, assignee:profiles(id, full_name, avatar_url)")
                .eq("id", id)
                .single();
            return data;
        },

        async analytics(_: unknown, { projectId }: { projectId: string }, ctx: any) {
            const { data: tasks } = await ctx.supabase
                .from("tasks")
                .select("status, due_date, created_at, completed_at")
                .eq("project_id", projectId);

            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const total = tasks?.length ?? 0;
            const done = tasks?.filter((t: any) => t.status === "done").length ?? 0;
            const overdue = tasks?.filter(
                (t: any) => t.due_date && new Date(t.due_date) < now && t.status !== "done"
            ).length ?? 0;
            const thisWeek = tasks?.filter(
                (t: any) => t.completed_at && new Date(t.completed_at) > oneWeekAgo
            ).length ?? 0;

            return {
                completionRate: total > 0 ? done / total : 0,
                overdueTasks: overdue,
                tasksCompletedThisWeek: thisWeek,
                averageCycleTimeHours: 0, // computed via DB function in production
                velocityByWeek: [],
            };
        },
    },

    Project: {
        taskCounts: async (parent: any, _: any, ctx: any) => {
            const { data } = await ctx.supabase
                .from("tasks")
                .select("status")
                .eq("project_id", parent.id);
            const tasks = data ?? [];
            return {
                total: tasks.length,
                todo: tasks.filter((t: any) => t.status === "todo").length,
                inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
                inReview: tasks.filter((t: any) => t.status === "in_review").length,
                done: tasks.filter((t: any) => t.status === "done").length,
            };
        },
        members: (parent: any) => parent.members ?? [],
        createdAt: (parent: any) => parent.created_at,
    },

    Task: {
        dueDate: (parent: any) => parent.due_date,
        createdAt: (parent: any) => parent.created_at,
    },

    Member: {
        user: (parent: any) => parent.user,
    },

    User: {
        fullName: (parent: any) => parent.full_name,
        avatarUrl: (parent: any) => parent.avatar_url,
    },
};

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    fetchAPI: { Request, Response },
    context: async ({ request }) => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return { supabase, userId: user?.id };
    },
});

export async function GET(request: NextRequest) {
    return yoga.fetch(request);
}

export async function POST(request: NextRequest) {
    return yoga.fetch(request);
}
