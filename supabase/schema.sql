-- ============================================================
-- NexusFlow — Complete Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE task_priority AS ENUM ('no_priority', 'urgent', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed', 'archived');
CREATE TYPE activity_type AS ENUM (
  'task_created', 'task_updated', 'task_deleted', 'task_assigned',
  'task_status_changed', 'task_priority_changed', 'comment_added',
  'member_added', 'member_removed', 'project_created', 'project_updated',
  'sprint_started', 'sprint_completed'
);

-- ============================================================
-- ORGANIZATIONS (Multi-tenancy root)
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_members INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 3,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{
    "email_task_assigned": true,
    "email_comment_added": true,
    "email_weekly_digest": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  identifier TEXT NOT NULL, -- e.g., "NEX", "PROJ" - used for task identifiers
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  status project_status DEFAULT 'active',
  start_date DATE,
  target_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, identifier)
);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- LABELS
-- ============================================================

CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- ============================================================
-- SPRINTS
-- ============================================================

CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS (Core entity)
-- ============================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- subtasks
  identifier TEXT NOT NULL, -- e.g., "NEX-42"
  title TEXT NOT NULL,
  description TEXT, -- rich text (Tiptap JSON stored as text)
  status task_status DEFAULT 'backlog',
  priority task_priority DEFAULT 'no_priority',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  due_date DATE,
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),
  sort_order NUMERIC DEFAULT 0,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task sequence tracker per project
CREATE TABLE task_sequences (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  last_number INTEGER DEFAULT 0
);

-- ============================================================
-- TASK LABELS (Many-to-many)
-- ============================================================

CREATE TABLE task_labels (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY FEED
-- ============================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  type activity_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS (for performance at 10M+ scale)
-- ============================================================

-- Dashboard stats per project
CREATE VIEW project_stats AS
SELECT
  p.id AS project_id,
  p.organization_id,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'todo') AS todo_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'backlog') AS backlog_tasks,
  COUNT(t.id) FILTER (WHERE t.priority = 'urgent') AS urgent_tasks,
  COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status != 'done') AS overdue_tasks,
  ROUND(
    COUNT(t.id) FILTER (WHERE t.status = 'done')::NUMERIC /
    NULLIF(COUNT(t.id), 0) * 100, 1
  ) AS completion_percentage
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id AND t.parent_task_id IS NULL
GROUP BY p.id, p.organization_id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-generate task identifier (e.g., NEX-42)
CREATE OR REPLACE FUNCTION generate_task_identifier()
RETURNS TRIGGER AS $$
DECLARE
  project_identifier TEXT;
  next_num INTEGER;
BEGIN
  SELECT identifier INTO project_identifier FROM projects WHERE id = NEW.project_id;
  
  INSERT INTO task_sequences (project_id, last_number)
  VALUES (NEW.project_id, 1)
  ON CONFLICT (project_id) DO UPDATE
  SET last_number = task_sequences.last_number + 1
  RETURNING last_number INTO next_num;
  
  NEW.identifier := project_identifier || '-' || next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_identifier
  BEFORE INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.identifier IS NULL OR NEW.identifier = '')
  EXECUTE FUNCTION generate_task_identifier();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), ' ', '.'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Critical for multi-tenant SaaS
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- Helper function: check org membership
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check org admin/owner
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Users can view any profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations
CREATE POLICY "Members can view org" ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY "Admins can update org" ON organizations FOR UPDATE USING (is_org_admin(id));
CREATE POLICY "Anyone can create org" ON organizations FOR INSERT WITH CHECK (true);

-- Organization members
CREATE POLICY "Members can view org members" ON organization_members FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admins can manage members" ON organization_members FOR ALL USING (is_org_admin(organization_id));
CREATE POLICY "Self can insert on join" ON organization_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Projects
CREATE POLICY "Org members can view projects" ON projects FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org members can create projects" ON projects FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Project members or org admins can update" ON projects FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Org admins can delete projects" ON projects FOR DELETE USING (is_org_admin(organization_id));

-- Tasks
CREATE POLICY "Project members can view tasks" ON tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_org_member(p.organization_id)
  ));
CREATE POLICY "Project members can create tasks" ON tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_org_member(p.organization_id)
  ));
CREATE POLICY "Project members can update tasks" ON tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_org_member(p.organization_id)
  ));

-- Comments
CREATE POLICY "Project members can view comments" ON comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.id = comments.task_id AND is_org_member(p.organization_id)
  ));
CREATE POLICY "Org members can add comments" ON comments FOR INSERT
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Comment authors can update" ON comments FOR UPDATE USING (author_id = auth.uid());

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Activities
CREATE POLICY "Org members can view activities" ON activities FOR SELECT USING (is_org_member(organization_id));

-- Labels
CREATE POLICY "Org members can view labels" ON labels FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org admins can manage labels" ON labels FOR ALL USING (is_org_admin(organization_id));

-- Sprints
CREATE POLICY "Org members can view sprints" ON sprints FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = sprints.project_id AND is_org_member(p.organization_id)
  ));

-- ============================================================
-- INDEXES — Critical for 10M+ user performance
-- ============================================================

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

CREATE INDEX idx_activities_org_id ON activities(organization_id, created_at DESC);
CREATE INDEX idx_activities_project_id ON activities(project_id, created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);

-- Full-text search on tasks
CREATE INDEX idx_tasks_title_fts ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_fts ON tasks USING gin(to_tsvector('english', COALESCE(description, '')));

-- ============================================================
-- REALTIME — Enable for real-time collaboration
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
