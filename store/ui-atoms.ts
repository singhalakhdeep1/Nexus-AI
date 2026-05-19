import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/**
 * NexusFlow — Jotai atoms for fine-grained UI preferences
 *
 * Why Jotai alongside Zustand?
 *   - Zustand: app-wide state (currentProject, user, kanban columns) — all consumers
 *     re-render when ANY slice changes.
 *   - Jotai: per-component preferences (sidebar width, density, color theme) —
 *     only the EXACT component using that atom re-renders.
 *
 * Pattern: Use Zustand for shared business state, Jotai for isolated UI atoms.
 */

// ─── Persisted preferences (survive page refresh) ─────────────────────────────

/** Kanban card density: "compact" shows title only; "comfortable" shows all fields */
export const cardDensityAtom = atomWithStorage<"compact" | "comfortable">(
    "nf:cardDensity",
    "comfortable"
);

/** Sidebar open/collapsed state */
export const sidebarCollapsedAtom = atomWithStorage<boolean>("nf:sidebarCollapsed", false);

/** Active theme override (overrides system preference) */
export const themeAtom = atomWithStorage<"system" | "light" | "dark">("nf:theme", "system");

/** Default view for task lists */
export const defaultViewAtom = atomWithStorage<"kanban" | "list" | "timeline" | "calendar">(
    "nf:defaultView",
    "kanban"
);

// ─── Session-scoped atoms (reset on page load) ─────────────────────────────────

/** Currently dragged task ID during Kanban DnD */
export const draggingTaskIdAtom = atom<string | null>(null);

/** Command palette open state */
export const commandPaletteOpenAtom = atom(false);

/** Inline task creation: which column is being edited */
export const inlineCreatingColumnAtom = atom<string | null>(null);

/** Global loading state for AI assistant */
export const aiAssistantOpenAtom = atom(false);
export const aiStreamingAtom = atom(false);

// ─── Derived atoms ─────────────────────────────────────────────────────────────

/** Sidebar width in pixels — derived from collapsed state */
export const sidebarWidthAtom = atom((get) =>
    get(sidebarCollapsedAtom) ? 64 : 240
);

/** Whether the editor is in "focus mode" (hides sidebar + toolbar) */
export const focusModeAtom = atom(false);
export const editorVisibleAtom = atom((get) => !get(focusModeAtom));
