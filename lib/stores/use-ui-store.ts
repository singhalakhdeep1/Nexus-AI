"use client";

import { create } from "zustand";
import type { TaskFilters } from "@/types";

interface UIState {
    // Sidebar
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Command palette
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;
    toggleCommandPalette: () => void;

    // Task creation modal
    isCreateTaskOpen: boolean;
    createTaskProjectId: string | null;
    createTaskStatus: string | null;
    openCreateTask: (projectId: string, status?: string) => void;
    closeCreateTask: () => void;

    // Task detail panel
    activeTaskId: string | null;
    setActiveTaskId: (id: string | null) => void;

    // Task filters per project
    taskFilters: Record<string, TaskFilters>;
    setTaskFilters: (projectId: string, filters: Partial<TaskFilters>) => void;
    resetTaskFilters: (projectId: string) => void;

    // View mode
    viewMode: "board" | "list" | "timeline";
    setViewMode: (mode: "board" | "list" | "timeline") => void;

    // Notifications
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
    toggleCommandPalette: () => set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),

    isCreateTaskOpen: false,
    createTaskProjectId: null,
    createTaskStatus: null,
    openCreateTask: (projectId, status = "todo") =>
        set({ isCreateTaskOpen: true, createTaskProjectId: projectId, createTaskStatus: status }),
    closeCreateTask: () =>
        set({ isCreateTaskOpen: false, createTaskProjectId: null, createTaskStatus: null }),

    activeTaskId: null,
    setActiveTaskId: (id) => set({ activeTaskId: id }),

    taskFilters: {},
    setTaskFilters: (projectId, filters) =>
        set((state) => ({
            taskFilters: {
                ...state.taskFilters,
                [projectId]: { ...state.taskFilters[projectId], ...filters },
            },
        })),
    resetTaskFilters: (projectId) =>
        set((state) => ({
            taskFilters: { ...state.taskFilters, [projectId]: {} },
        })),

    viewMode: "board",
    setViewMode: (mode) => set({ viewMode: mode }),

    unreadNotifications: 0,
    setUnreadNotifications: (count) => set({ unreadNotifications: count }),
}));
