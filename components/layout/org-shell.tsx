"use client";

import { useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useAppStore } from "@/lib/stores/use-app-store";
import { CommandPalette } from "@/components/shared/command-palette";
import { GlobalHotkeys } from "@/components/shared/global-hotkeys";
import type { Organization, Profile, Project } from "@/types";

interface OrgShellProps {
    org: Organization;
    profile: Profile | null;
    projects: Partial<Project>[];
    orgSlug: string;
    children: React.ReactNode;
}

export function OrgShell({ org, profile, projects, orgSlug, children }: OrgShellProps) {
    const { isSidebarOpen } = useUIStore();
    const { setCurrentOrg, setUser } = useAppStore();

    // Sync server data to client store on mount
    useState(() => {
        setCurrentOrg(org);
        if (profile) setUser(profile);
    });

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            {/* Global keyboard shortcuts */}
            <GlobalHotkeys orgSlug={orgSlug} />

            {/* Top header (full width) */}
            <Header org={org} profile={profile} orgSlug={orgSlug} />

            {/* Resizable sidebar + content */}
            <PanelGroup direction="horizontal" className="flex-1 overflow-hidden" autoSaveId={`nexusflow-${orgSlug}`}>
                {isSidebarOpen && (
                    <>
                        <Panel
                            id="sidebar"
                            defaultSize={18}
                            minSize={14}
                            maxSize={30}
                            className="overflow-hidden"
                        >
                            <Sidebar org={org} profile={profile} projects={projects} orgSlug={orgSlug} />
                        </Panel>

                        <PanelResizeHandle className="w-px bg-border hover:bg-primary/50 transition-colors cursor-col-resize data-[resize-handle-active]:bg-primary/80" />
                    </>
                )}

                <Panel id="main-content" className="overflow-hidden">
                    <main className="h-full overflow-y-auto">
                        {children}
                    </main>
                </Panel>
            </PanelGroup>

            {/* Command Palette */}
            <CommandPalette orgSlug={orgSlug} projects={projects} />

            {/* Toast notifications */}
            <Toaster richColors position="bottom-right" closeButton />
        </div>
    );
}
