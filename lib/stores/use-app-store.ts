"use client";

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { Profile, Organization, OrganizationMember } from "@/types";

interface AppState {
    // Auth
    user: Profile | null;
    setUser: (user: Profile | null) => void;

    // Current organization
    currentOrg: Organization | null;
    setCurrentOrg: (org: Organization | null) => void;

    // All orgs user belongs to
    organizations: OrganizationMember[];
    setOrganizations: (orgs: OrganizationMember[]) => void;

    // Unread notifications count
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;
    decrementUnread: () => void;

    // Reset
    reset: () => void;
}

export const useAppStore = create<AppState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                setUser: (user) => set({ user }),

                currentOrg: null,
                setCurrentOrg: (org) => set({ currentOrg: org }),

                organizations: [],
                setOrganizations: (organizations) => set({ organizations }),

                unreadNotifications: 0,
                setUnreadNotifications: (count) => set({ unreadNotifications: count }),
                decrementUnread: () =>
                    set((state) => ({
                        unreadNotifications: Math.max(0, state.unreadNotifications - 1),
                    })),

                reset: () =>
                    set({
                        user: null,
                        currentOrg: null,
                        organizations: [],
                        unreadNotifications: 0,
                    }),
            }),
            {
                name: "nexusflow-app-store",
                partialize: (state) => ({
                    currentOrg: state.currentOrg,
                }),
            }
        ),
        { name: "AppStore" }
    )
);
