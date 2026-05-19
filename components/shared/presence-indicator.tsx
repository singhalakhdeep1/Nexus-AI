"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { getInitials, stringToColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
    users: { user_id: string; full_name: string; avatar_url?: string }[];
    max?: number;
    className?: string;
}

export function PresenceIndicator({ users, max = 5, className }: PresenceIndicatorProps) {
    const visibleUsers = users.slice(0, max);
    const overflow = users.length - max;

    if (users.length === 0) return null;

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex -space-x-2">
                {visibleUsers.map((u) => (
                    <Tooltip key={u.user_id} content={`${u.full_name} — online`}>
                        <div className="relative">
                            <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-emerald-500/50">
                                <AvatarImage src={u.avatar_url} />
                                <AvatarFallback
                                    className="text-[8px]"
                                    style={{ backgroundColor: stringToColor(u.full_name) }}
                                >
                                    {getInitials(u.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            {/* Green online dot */}
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-background" />
                        </div>
                    </Tooltip>
                ))}
                {overflow > 0 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-[9px] font-medium text-muted-foreground">+{overflow}</span>
                    </div>
                )}
            </div>
            <span className="ml-2 text-xs text-muted-foreground">
                {users.length} online
            </span>
        </div>
    );
}
