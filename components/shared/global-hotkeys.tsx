"use client";

/**
 * Global keyboard shortcuts for NexusFlow using react-hotkeys-hook.
 * Mount this component once inside OrgShell to activate all shortcuts.
 */

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/stores/use-ui-store";

interface Props {
    orgSlug: string;
}

export function GlobalHotkeys({ orgSlug }: Props) {
    const router = useRouter();
    const { toggleSidebar, toggleCommandPalette } = useUIStore();

    const base = `/org/${orgSlug}`;

    // ── Navigation ────────────────────────────────────────────────────────────

    // ⌘K — command palette (also handled inside CommandPalette itself, but keep in sync)
    useHotkeys("mod+k", (e) => { e.preventDefault(); toggleCommandPalette(); }, { enableOnFormTags: false });

    // G → H — go to home / dashboard
    useHotkeys("g h", () => router.push(base), { enableOnFormTags: false });

    // G → P — go to projects
    useHotkeys("g p", () => router.push(`${base}/projects`), { enableOnFormTags: false });

    // G → N — go to notifications
    useHotkeys("g n", () => router.push(`${base}/notifications`), { enableOnFormTags: false });

    // G → S — go to settings
    useHotkeys("g s", () => router.push(`${base}/settings`), { enableOnFormTags: false });

    // G → M — go to members
    useHotkeys("g m", () => router.push(`${base}/members`), { enableOnFormTags: false });

    // ── Views ─────────────────────────────────────────────────────────────────

    // ⌘\ — toggle sidebar
    useHotkeys("mod+\\", (e) => { e.preventDefault(); toggleSidebar(); }, { enableOnFormTags: false });

    // ? — show keyboard shortcuts (dispatches a custom event)
    useHotkeys("shift+/", (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("nexusflow:show-shortcuts"));
    }, { enableOnFormTags: false });

    // ── Tasks ─────────────────────────────────────────────────────────────────

    // N — create new task (dispatches a custom event that task list components listen to)
    useHotkeys("n", (e) => {
        // Only trigger when no input/textarea is focused
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
        window.dispatchEvent(new CustomEvent("nexusflow:create-task"));
    }, { enableOnFormTags: false });

    // ⌘Enter — submit active form
    useHotkeys("mod+enter", (e) => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return;
        const form = active.closest("form");
        if (form) {
            const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
            submit?.click();
        }
    }, { enableOnFormTags: true });

    // Esc is handled natively by dialogs/sheets — no need to override

    return null; // purely side-effectful
}
