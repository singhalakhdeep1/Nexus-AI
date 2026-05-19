"use client";

import { RoomProvider, useOthers, useUpdateMyPresence, useSelf, useBroadcastEvent } from "@liveblocks/react/suspense";
import { ClientSideSuspense } from "@liveblocks/react";
import { ReactNode, useEffect, useCallback } from "react";

interface Props {
    projectId: string;
    children: ReactNode;
}

/**
 * Liveblocks room wrapper for the Kanban board.
 * Provides real-time presence (live cursors) and storage (column order sync).
 */
export function KanbanRoomProvider({ projectId, children }: Props) {
    return (
        <RoomProvider
            id={`project:${projectId}`}
            initialPresence={{ cursor: null, selectedTaskId: null, name: "", avatar: "", color: "" }}
            initialStorage={{ taskOrder: {} }}
        >
            <ClientSideSuspense fallback={<div className="p-4 text-sm text-muted-foreground animate-pulse">Connecting…</div>}>
                {children}
            </ClientSideSuspense>
        </RoomProvider>
    );
}

/**
 * Renders floating cursor labels for all other connected users.
 * Each cursor shows the collaborator's name in their assigned color.
 */
export function LiveCursors() {
    const others = useOthers();

    return (
        <>
            {others.map(({ connectionId, presence, info }) => {
                if (!presence.cursor) return null;
                return (
                    <div
                        key={connectionId}
                        className="pointer-events-none fixed z-50 select-none"
                        style={{ left: presence.cursor.x, top: presence.cursor.y }}
                    >
                        {/* Cursor SVG */}
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                            <path d="M0 0L0 14L4 10.5L6 16L8 15L6 9.5L11 9.5L0 0Z" fill={info?.color ?? "#6366f1"} />
                        </svg>
                        {/* Name label */}
                        <span
                            className="ml-2 mt-1 absolute top-4 left-2 text-xs text-white px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium"
                            style={{ backgroundColor: info?.color ?? "#6366f1" }}
                        >
                            {info?.name ?? "Anonymous"}
                        </span>
                    </div>
                );
            })}
        </>
    );
}

/**
 * Hook: track mouse position and broadcast as Liveblocks presence.
 * Call inside the Kanban board component.
 */
export function useLiveCursor() {
    const updatePresence = useUpdateMyPresence();

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            updatePresence({ cursor: { x: e.clientX, y: e.clientY } });
        },
        [updatePresence]
    );

    const handleMouseLeave = useCallback(() => {
        updatePresence({ cursor: null });
    }, [updatePresence]);

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [handleMouseMove, handleMouseLeave]);
}

/**
 * Shows avatar stack of all currently connected collaborators.
 */
export function CollaboratorAvatars() {
    const others = useOthers();
    const self = useSelf();

    const all = [self, ...others].filter(Boolean);

    return (
        <div className="flex -space-x-2">
            {all.slice(0, 5).map((user, i) => (
                <div
                    key={user?.connectionId ?? i}
                    className="w-7 h-7 rounded-full ring-2 ring-background flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: user?.info?.color ?? "#6366f1" }}
                    title={user?.info?.name ?? "You"}
                >
                    {(user?.info?.name ?? "?")[0].toUpperCase()}
                </div>
            ))}
            {all.length > 5 && (
                <div className="w-7 h-7 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{all.length - 5}
                </div>
            )}
        </div>
    );
}
