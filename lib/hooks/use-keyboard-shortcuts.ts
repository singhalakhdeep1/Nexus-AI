"use client";

import { useEffect, useCallback } from "react";
import { useUIStore } from "@/lib/stores/use-ui-store";

type ShortcutHandler = (e: KeyboardEvent) => void;

export function useKeyboardShortcuts(handlers?: Record<string, ShortcutHandler>) {
    const { setCommandPaletteOpen, setCreateTaskDialogOpen } = useUIStore();

    const defaultHandlers: Record<string, ShortcutHandler> = {
        // ⌘K / Ctrl+K — command palette
        "meta+k": (e) => { e.preventDefault(); setCommandPaletteOpen(true); },
        "ctrl+k": (e) => { e.preventDefault(); setCommandPaletteOpen(true); },
        // N — new task (not in input)
        "n": () => setCreateTaskDialogOpen(true),
        // Escape — handled by individual dialogs
        ...handlers,
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        const isEditable = tag === "input" || tag === "textarea" || (e.target as HTMLElement).isContentEditable;

        // Build key string
        let key = e.key.toLowerCase();
        if (e.metaKey) key = `meta+${key}`;
        else if (e.ctrlKey) key = `ctrl+${key}`;

        const handler = defaultHandlers[key];
        if (!handler) return;

        // Skip single-letter shortcuts in editable contexts
        if (isEditable && !e.metaKey && !e.ctrlKey) return;

        handler(e);
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}
