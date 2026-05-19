import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    description: z.string().max(500).optional(),
    identifier: z
        .string()
        .min(2, "Identifier must be 2-5 characters")
        .max(5, "Identifier must be 2-5 characters")
        .regex(/^[A-Z]+$/, "Only uppercase letters allowed"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").optional(),
    target_date: z.string().optional(),
});

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().optional(),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]),
    priority: z.enum(["no_priority", "urgent", "high", "medium", "low"]),
    assignee_id: z.string().uuid().optional().nullable(),
    due_date: z.string().optional().nullable(),
    sprint_id: z.string().uuid().optional().nullable(),
    estimated_hours: z.number().min(0).max(999).optional().nullable(),
    label_ids: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
    id: z.string().uuid(),
});

export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(5000),
    parent_comment_id: z.string().uuid().optional().nullable(),
});

export const createOrganizationSchema = z.object({
    name: z.string().min(2, "Organization name must be at least 2 characters").max(80),
    slug: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

export const inviteMemberSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["admin", "member", "viewer"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
