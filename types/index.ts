// ============================================================
// TypeScript types generated from Supabase schema
// Run: npm run db:generate-types to auto-generate from live DB
// ============================================================

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskPriority = 'no_priority' | 'urgent' | 'high' | 'medium' | 'low';
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ActivityType =
    | 'task_created' | 'task_updated' | 'task_deleted' | 'task_assigned'
    | 'task_status_changed' | 'task_priority_changed' | 'comment_added'
    | 'member_added' | 'member_removed' | 'project_created' | 'project_updated'
    | 'sprint_started' | 'sprint_completed';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
    bio: string | null;
    timezone: string;
    notification_preferences: NotificationPreferences;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferences {
    email_task_assigned: boolean;
    email_comment_added: boolean;
    email_weekly_digest: boolean;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    website: string | null;
    plan: 'free' | 'pro' | 'enterprise';
    max_members: number;
    max_projects: number;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: MemberRole;
    invited_by: string | null;
    joined_at: string;
    profile?: Profile;
}

export interface Project {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    identifier: string;
    color: string;
    icon: string;
    status: ProjectStatus;
    start_date: string | null;
    target_date: string | null;
    created_by: string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    // Joined fields
    stats?: ProjectStats;
    member_count?: number;
}

export interface ProjectStats {
    project_id: string;
    organization_id: string;
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    backlog_tasks: number;
    urgent_tasks: number;
    overdue_tasks: number;
    completion_percentage: number;
}

export interface Label {
    id: string;
    organization_id: string;
    name: string;
    color: string;
    created_at: string;
}

export interface Sprint {
    id: string;
    project_id: string;
    name: string;
    goal: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    project_id: string;
    sprint_id: string | null;
    parent_task_id: string | null;
    identifier: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id: string | null;
    reporter_id: string;
    due_date: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    sort_order: number;
    completed_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    // Joined fields
    assignee?: Profile;
    reporter?: Profile;
    labels?: Label[];
    subtasks?: Task[];
    comment_count?: number;
    attachment_count?: number;
}

export interface Comment {
    id: string;
    task_id: string;
    author_id: string;
    content: string;
    is_edited: boolean;
    parent_comment_id: string | null;
    created_at: string;
    updated_at: string;
    author?: Profile;
    replies?: Comment[];
}

export interface Attachment {
    id: string;
    task_id: string;
    uploaded_by: string;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    created_at: string;
    uploader?: Profile;
}

export interface Activity {
    id: string;
    organization_id: string;
    project_id: string | null;
    task_id: string | null;
    actor_id: string;
    type: ActivityType;
    metadata: Record<string, unknown>;
    created_at: string;
    actor?: Profile;
    task?: Pick<Task, 'id' | 'identifier' | 'title'>;
}

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: string;
    title: string;
    message: string | null;
    link: string | null;
    is_read: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
    actor?: Profile;
}

// ============================================================
// UI / App-level types
// ============================================================

export interface KanbanColumn {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    color: string;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id?: string;
    due_date?: string;
    sprint_id?: string;
    label_ids?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
    id: string;
    sort_order?: number;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    identifier: string;
    color?: string;
    target_date?: string;
}

export interface DashboardStats {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalMembers: number;
    completionRate: number;
    overdueTasks?: number;
    velocity?: number;
}

export type SortOrder = 'asc' | 'desc';

export interface TaskFilters {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    assignee_id?: string[];
    label_ids?: string[];
    sprint_id?: string;
    search?: string;
    sort_by?: 'created_at' | 'updated_at' | 'priority' | 'due_date' | 'sort_order';
    sort_order?: SortOrder;
}
