# ADR 0003 — Liveblocks for Presence, Yjs for Document Co-editing

**Date:** 2025-03  
**Status:** Accepted

## Context

The Kanban board needs real-time multiplayer: live cursors, presence indicators, and conflict-free column reordering. The document editor needs CRDT-based co-editing.

## Options Considered

| Option           | Presence  | CRDT                     | Hosting     | Cost        |
| ---------------- | --------- | ------------------------ | ----------- | ----------- |
| Liveblocks       | ✅ native | ✅ via `@liveblocks/yjs` | Managed     | Pay-per-MAU |
| Yjs + PartyKit   | ❌ custom | ✅                       | Self-hosted | Infra cost  |
| Yjs + Hocuspocus | ❌ custom | ✅                       | Self-hosted | Infra cost  |
| Socket.IO        | ❌ custom | ❌                       | Self-hosted | Dev time    |

## Decision

**Liveblocks** for the Kanban board (presence + storage).  
**Yjs + Hocuspocus** for document co-editing (already in use by Tiptap's rich text editor).

### Why Liveblocks for Kanban?

1. **Conflict resolution built-in** — `LiveMap` and `LiveList` handle concurrent card moves without custom merge logic
2. **`userInfo` metadata** — name, avatar, color wired in one auth call
3. **No WebSocket infrastructure** — managed globally distributed edge nodes

### Why not Liveblocks for documents?

Tiptap has a first-class `@tiptap/extension-collaboration` built on Yjs. Mixing Liveblocks Yjs with Tiptap's extension adds complexity. Hocuspocus is the canonical Tiptap collaboration backend.

## Consequences

Two real-time vendors. Accepted trade-off: each is the best fit for its specific use case, and the boundary is clear (Kanban = Liveblocks, Documents = Hocuspocus).
