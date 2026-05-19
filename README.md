# NexusFlow

**Production-grade SaaS Project Management Platform** — Linear + Notion + Jira combined, built with Next.js 15, Supabase, TypeScript, and a modern component stack.

---

## Tech Stack

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| Framework        | Next.js 15 (App Router, Turbopack)                |
| Database & Auth  | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State Management | Zustand v5 + TanStack Query v5                    |
| UI               | shadcn/ui (Radix UI + Tailwind CSS)               |
| Drag & Drop      | @dnd-kit                                          |
| Rich Text        | Tiptap                                            |
| Charts           | Recharts                                          |
| Forms            | React Hook Form + Zod                             |
| AI               | OpenAI GPT-4o-mini                                |
| Animations       | Framer Motion                                     |

---

## Features

- **Kanban Board** — Real-time drag-and-drop with @dnd-kit, column-based workflow
- **Real-time Collaboration** — Supabase Realtime subscriptions on tasks/comments/notifications
- **Multi-tenant Architecture** — Organizations → Projects → Tasks with full RLS
- **AI Task Generation** — GPT-4o-mini generates tasks from a natural language prompt
- **Rich Text Editor** — Tiptap with toolbar (bold, italic, lists, code blocks)
- **Command Palette** — ⌘K search across tasks, projects, and navigation
- **Dark Mode** — Full dark/light theme with next-themes
- **Optimistic Updates** — Instant UI feedback with TanStack Query rollback
- **Full Auth** — Email/password + GitHub OAuth + forgot/reset password
- **Activity Feed** — Per-org audit trail of all actions
- **Project Analytics** — Completion rate, task breakdown, sprint stats
- **Row Level Security** — Every table protected at the DB level

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/yourname/nexusflow
cd nexusflow
npm install
```

### 2. Create Supabase Project

Go to [supabase.com](https://supabase.com) → New Project → copy your project URL and anon key.

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # optional for admin tasks
OPENAI_API_KEY=sk-...                              # optional for AI features
```

### 4. Run Database Schema

In the Supabase dashboard → SQL Editor → paste the contents of `supabase/schema.sql` and run.

Optionally seed demo data:

```sql
-- paste supabase/seed.sql
```

### 5. Configure Auth Providers

In Supabase Dashboard → Authentication → Providers:

- Enable **GitHub** OAuth (create a GitHub OAuth App, add callback URL: `https://your-project.supabase.co/auth/v1/callback`)
- Add `http://localhost:3000/auth/callback` as allowed redirect URL

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
nexusflow/
├── app/
│   ├── (auth)/               # Login, register, forgot/reset password
│   ├── (dashboard)/
│   │   └── org/[orgSlug]/    # Per-org pages (overview, projects, members, settings)
│   ├── api/
│   │   └── ai/generate/      # OpenAI task generation endpoint
│   ├── auth/callback/        # Supabase OAuth callback handler
│   ├── onboarding/           # New user org creation
│   └── page.tsx              # Root redirect
├── components/
│   ├── dashboard/            # Overview stats, activity feed
│   ├── kanban/               # Board, columns, task cards, create dialog
│   ├── layout/               # Sidebar, header, org shell
│   ├── projects/             # Project list view, create dialog
│   ├── shared/               # Priority badge, status badge, command palette
│   └── ui/                   # Base shadcn components
├── lib/
│   ├── hooks/                # TanStack Query hooks (projects, tasks, realtime, members)
│   ├── stores/               # Zustand stores (app, ui)
│   ├── supabase/             # Client, server, middleware helpers
│   └── validations/          # Zod schemas
├── supabase/
│   ├── schema.sql            # Full database schema with RLS
│   └── seed.sql              # Demo data
└── types/                    # TypeScript types + Supabase DB types
```

---

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run type-check   # TypeScript check without building
npm run lint         # ESLint
npm run db:generate-types  # Regenerate Supabase TypeScript types
```

---

## Database Schema (Overview)

```
organizations → organization_members → profiles
     │
     └── projects → project_members
                       │
                       ├── tasks → task_labels → labels
                       │       └── comments
                       │       └── attachments
                       ├── sprints
                       └── activities
```

Key design choices:

- **Task identifiers** auto-generated via DB trigger (`PROJECT-1`, `PROJECT-2`…)
- **RLS helper functions** (`is_org_member`, `is_org_admin`) as `SECURITY DEFINER` to avoid recursion
- **Full-text search** index on `tasks(title, description)` using `tsvector`
- **Realtime publication** on tasks, comments, notifications, activities

---

## Architecture Highlights (for FAANG interviews)

### Scalability

- **Row Level Security** at the database level — no application-level auth checks needed
- **Connection pooling** via Supabase's built-in PgBouncer
- **Optimistic updates** with rollback — zero-latency perceived UX
- **Edge-ready** — Next.js middleware runs on Vercel Edge Network

### Real-time

- Supabase Realtime channels per project (PostgreSQL NOTIFY → WebSocket → browser)
- TanStack Query cache invalidation on Realtime events

### Security (OWASP Top 10)

- Input validation with Zod at API boundaries
- Parameterized queries via Supabase client (no SQL injection)
- RLS policies enforce authorization at DB level
- CSRF protection via Supabase token rotation
- No secrets exposed to client (service role key is server-only)

---

## Deployment

### Vercel (recommended)

```bash
vercel deploy
```

Add environment variables in Vercel dashboard. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Environment Variables Required

| Variable                        | Required | Description                  |
| ------------------------------- | -------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | Your Supabase project URL    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | Supabase anon key            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Optional | Server-only admin operations |
| `OPENAI_API_KEY`                | Optional | AI task generation           |

---

## License

MIT
