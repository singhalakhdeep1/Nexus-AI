import { pgTable, uuid, text, varchar, timestamp, boolean, integer, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "in_review", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "archived", "completed"]);
export const memberRoleEnum = pgEnum("member_role", ["viewer", "member", "admin", "owner"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "pro", "enterprise"]);

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profiles = pgTable(
    "profiles",
    {
        id: uuid("id").primaryKey(),
        email: varchar("email", { length: 255 }).notNull().unique(),
        fullName: varchar("full_name", { length: 255 }),
        username: varchar("username", { length: 50 }).unique(),
        avatarUrl: text("avatar_url"),
        bio: text("bio"),
        subscriptionTier: subscriptionTierEnum("subscription_tier").default("free").notNull(),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [index("profiles_email_idx").on(t.email)]
);

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    logoUrl: text("logo_url"),
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationMembers = pgTable(
    "organization_members",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => profiles.id, { onDelete: "cascade" }),
        role: memberRoleEnum("role").default("member").notNull(),
        joinedAt: timestamp("joined_at").defaultNow().notNull(),
    },
    (t) => [uniqueIndex("org_member_unique").on(t.organizationId, t.userId)]
);

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable(
    "projects",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        ownerId: uuid("owner_id")
            .notNull()
            .references(() => profiles.id),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        description: text("description"),
        color: varchar("color", { length: 7 }).default("#6366f1"),
        icon: varchar("icon", { length: 50 }).default("folder"),
        status: projectStatusEnum("status").default("active").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("project_slug_org_unique").on(t.organizationId, t.slug),
        index("project_org_idx").on(t.organizationId),
    ]
);

export const projectMembers = pgTable(
    "project_members",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => profiles.id, { onDelete: "cascade" }),
        role: memberRoleEnum("role").default("member").notNull(),
        joinedAt: timestamp("joined_at").defaultNow().notNull(),
    },
    (t) => [uniqueIndex("project_member_unique").on(t.projectId, t.userId)]
);

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks = pgTable(
    "tasks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        sprintId: uuid("sprint_id").references(() => sprints.id, { onDelete: "set null" }),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => profiles.id),
        assigneeId: uuid("assignee_id").references(() => profiles.id, { onDelete: "set null" }),
        title: varchar("title", { length: 500 }).notNull(),
        description: text("description"),
        status: taskStatusEnum("status").default("todo").notNull(),
        priority: taskPriorityEnum("priority").default("medium").notNull(),
        dueDate: timestamp("due_date"),
        completedAt: timestamp("completed_at"),
        position: integer("position").default(0).notNull(),
        archived: boolean("archived").default(false).notNull(),
        metadata: jsonb("metadata"),
        // pgvector column for semantic search — stored as text, cast at query time
        embeddingContent: text("embedding_content"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        index("tasks_project_status_idx").on(t.projectId, t.status),
        index("tasks_assignee_idx").on(t.assigneeId),
        index("tasks_sprint_idx").on(t.sprintId),
    ]
);

export const taskComments = pgTable("task_comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
        .notNull()
        .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
        .notNull()
        .references(() => profiles.id),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Labels ───────────────────────────────────────────────────────────────────

export const labels = pgTable("labels", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(),
});

export const taskLabels = pgTable(
    "task_labels",
    {
        taskId: uuid("task_id")
            .notNull()
            .references(() => tasks.id, { onDelete: "cascade" }),
        labelId: uuid("label_id")
            .notNull()
            .references(() => labels.id, { onDelete: "cascade" }),
    },
    (t) => [uniqueIndex("task_label_unique").on(t.taskId, t.labelId)]
);

// ─── Sprints ──────────────────────────────────────────────────────────────────

export const sprints = pgTable("sprints", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    goal: text("goal"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
    projectMembers: many(projectMembers),
    tasks: many(tasks, { relationName: "assignee" }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
    members: many(projectMembers),
    tasks: many(tasks),
    labels: many(labels),
    sprints: many(sprints),
    organization: one(organizations, { fields: [projects.organizationId], references: [organizations.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
    assignee: one(profiles, { fields: [tasks.assigneeId], references: [profiles.id], relationName: "assignee" }),
    comments: many(taskComments),
    labels: many(taskLabels),
}));
