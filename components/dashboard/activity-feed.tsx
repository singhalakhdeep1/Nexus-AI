"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials, stringToColor } from "@/lib/utils";

interface Activity {
    id: string;
    activity_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
    profiles?: { full_name: string; avatar_url?: string } | null;
}

function activityLabel(type: string, metadata: Record<string, unknown>) {
    switch (type) {
        case "task_created": return `created task ${metadata.identifier || ""}`;
        case "task_updated": return `updated task ${metadata.identifier || ""}`;
        case "task_status_changed": return `moved to ${metadata.new_status || ""}`;
        case "comment_added": return "left a comment";
        case "member_invited": return `invited ${metadata.invitee || "someone"}`;
        case "project_created": return `created project ${metadata.project_name || ""}`;
        default: return type.replace(/_/g, " ");
    }
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
    if (activities.length === 0) {
        return (
            <div className="px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="divide-y max-h-80 overflow-y-auto">
            {activities.map((activity) => {
                const name = activity.profiles?.full_name || "Someone";
                return (
                    <div key={activity.id} className="flex items-start gap-2.5 px-4 py-3">
                        <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                            <AvatarImage src={activity.profiles?.avatar_url} />
                            <AvatarFallback
                                className="text-[9px]"
                                style={{ backgroundColor: stringToColor(name) }}
                            >
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed">
                                <span className="font-medium">{name}</span>{" "}
                                <span className="text-muted-foreground">
                                    {activityLabel(activity.activity_type, activity.metadata || {})}
                                </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatRelativeTime(activity.created_at)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
