# ADR 0002 — tRPC for Internal API, GraphQL for Public Read

**Date:** 2025-02  
**Status:** Accepted

## Context

We need a typed API layer for client-server communication. Two common choices: tRPC or GraphQL.

## Decision

**Use both, for different purposes:**

| Layer                              | Technology                 | Reason                                                                                              |
| ---------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Internal (Next.js client → server) | **tRPC**                   | End-to-end type safety, no schema duplication, native TanStack Query integration, batching          |
| Public read-only API               | **GraphQL** (graphql-yoga) | Enables external consumers (mobile app, partner integrations) to query exactly the fields they need |

## Trade-offs

**tRPC:**

- ✅ Zero schema drift — TypeScript is the schema
- ✅ `useQuery`/`useMutation` generated automatically
- ✅ Supports `superjson` (Date, Map, Set serialization)
- ❌ Not consumable outside TypeScript ecosystem without a REST bridge

**GraphQL:**

- ✅ Language-agnostic — React Native, Python scripts, third-party tools can all query it
- ✅ Introspection + GraphiQL playground for developer experience
- ❌ N+1 problem requires DataLoader (deferred to v2)
- ❌ More boilerplate for simple mutations

## Consequences

Maintaining two API layers adds surface area. We mitigate this by keeping GraphQL **read-only** — all writes go through tRPC where type safety is non-negotiable.
