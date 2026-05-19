# ADR 0001 — Why Supabase over PlanetScale / Neon

**Date:** 2025-01  
**Status:** Accepted  
**Deciders:** @team

## Context

We needed a PostgreSQL provider that supports:

- Row-Level Security (multi-tenant data isolation)
- Realtime subscriptions (live Kanban updates)
- Auth + Storage bundled (reduce vendor sprawl)
- pgvector for AI semantic search

## Options Considered

| Option      | RLS       | Realtime     | Auth        | pgvector | Free tier  |
| ----------- | --------- | ------------ | ----------- | -------- | ---------- |
| Supabase    | ✅ native | ✅ WebSocket | ✅ built-in | ✅       | ✅ 500MB   |
| PlanetScale | ❌        | ❌           | ❌          | ❌       | ⚠️ limited |
| Neon        | ❌        | ❌           | ❌          | ✅       | ✅         |
| Railway PG  | ❌        | ❌           | ❌          | ✅       | ✅         |

## Decision

**Supabase** — only option that satisfies all four requirements in a single service.

## Consequences

**Positive:** 40% less backend code vs. rolling custom auth + realtime.  
**Negative:** Vendor lock-in on RLS policies; if migrating, rewrite policies as application-level checks.  
**Mitigation:** Drizzle ORM provides a database-agnostic query layer; RLS policies live in `supabase/schema.sql` and can be translated to application middleware if needed.
