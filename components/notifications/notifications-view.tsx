"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Bell, BellOff, CheckCheck, MessageSquare, Tag, UserPlus,
    AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NOTIFICATION_ICONS: Record<string, { icon: any; color: string }> = {
    task_assigned: { icon: UserPlus, color: "text-blue-500" },
    comment_added: { icon: MessageSquare, color: "text-violet-500" },
    status_changed: { icon: CheckCircle2, color: "text-emerald-500" },
    priority_changed: { icon: AlertTriangle, color: "text-amber-500" },
    due_date_approaching: { icon: Clock, color: "text-orange-500" },
    mentioned: { icon: Tag, color: "text-pink-500" },
};

interface NotificationsViewProps {
    notifications: any[];
    userId: string;
    orgSlug: string;
}

export function NotificationsView({ notifications: initialNotifications, userId, orgSlug }: NotificationsViewProps) {
    const router = useRouter();
    const supabase = createClient();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isPending, startTransition] = useTransition();

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const markAllRead = async () => {
        startTransition(async () => {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false);
            router.refresh();
        });
    };

    const markRead = async (id: string) => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    };

    const clearAll = async () => {
        startTransition(async () => {
            setNotifications([]);
            await supabase.from("notifications").delete().eq("user_id", userId);
            router.refresh();
        });
    };

    return (
        <div className="p-6 space-y-4 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    {unreadCount > 0 && (
                        <Badge>{unreadCount} unread</Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead} disabled={isPending}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark all read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll} disabled={isPending}>
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Empty state */}
            {notifications.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <BellOff className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm mt-1">You&apos;re all caught up!</p>
                </div>
            )}

            {/* Notification list */}
            <div className="space-y-1">
                {notifications.map((n) => {
                    const config = NOTIFICATION_ICONS[n.type] ?? { icon: Bell, color: "text-muted-foreground" };
                    const Icon = config.icon;

                    return (
                        <div
                            key={n.id}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                                !n.is_read && "bg-primary/5 border-primary/20"
                            )}
                            onClick={() => markRead(n.id)}
                        >
                            <div className={cn("mt-0.5 shrink-0", config.color)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-sm", !n.is_read && "font-medium")}>{n.title}</p>
                                {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                                <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.created_at)}</p>
                            </div>
                            {!n.is_read && (
                                <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
