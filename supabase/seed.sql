-- ============================================================
-- Seed data for development
-- ============================================================

-- Demo organization
INSERT INTO organizations (id, name, slug, plan, max_members, max_projects)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Acme Corp',
  'acme-corp',
  'pro',
  50,
  20
);

-- Demo labels
INSERT INTO labels (organization_id, name, color) VALUES
('a0000000-0000-0000-0000-000000000001', 'bug', '#ef4444'),
('a0000000-0000-0000-0000-000000000001', 'feature', '#6366f1'),
('a0000000-0000-0000-0000-000000000001', 'improvement', '#f59e0b'),
('a0000000-0000-0000-0000-000000000001', 'documentation', '#10b981'),
('a0000000-0000-0000-0000-000000000001', 'design', '#ec4899'),
('a0000000-0000-0000-0000-000000000001', 'backend', '#8b5cf6'),
('a0000000-0000-0000-0000-000000000001', 'frontend', '#06b6d4');
