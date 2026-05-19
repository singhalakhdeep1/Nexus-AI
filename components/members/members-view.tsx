"use client";

import { useState } from "react";
import { format } from "date-fns";
import { UserPlus, Shield, User, Crown, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { getInitials, stringToColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ROLE_CONFIG: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "outline" }> = {
    owner: { label: "Owner", icon: Crown, variant: "default" },
    admin: { label: "Admin", icon: Shield, variant: "secondary" },
    member: { label: "Member", icon: User, variant: "outline" },
};

interface MembersViewProps {
    org: { id: string; name: string; slug: string };
    members: any[];
    currentUserId: string;
    currentUserRole: string;
}

export function MembersView({ org, members, currentUserId, currentUserRole }: MembersViewProps) {
    const router = useRouter();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removingMember, setRemovingMember] = useState<any | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const supabase = createClient();
    const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

    const handleRemove = async () => {
        if (!removingMember) return;
        setIsRemoving(true);
        await supabase
            .from("organization_members")
            .delete()
            .eq("org_id", org.id)
            .eq("user_id", removingMember.user_id);
        setIsRemoving(false);
        setRemovingMember(null);
        router.refresh();
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Members</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {members.length} member{members.length !== 1 ? "s" : ""} in {org.name}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setInviteOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            {isAdmin && <TableHead className="w-12" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => {
                            const profile = member.profiles;
                            const roleConfig = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
                            const RoleIcon = roleConfig.icon;
                            const isCurrentUser = member.user_id === currentUserId;
                            const isOwner = member.role === "owner";

                            return (
                                <TableRow key={member.user_id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={profile?.avatar_url} />
                                                <AvatarFallback
                                                    className="text-xs"
                                                    style={{ backgroundColor: stringToColor(profile?.full_name || "") }}
                                                >
                                                    {getInitials(profile?.full_name || "")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {profile?.full_name}
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={roleConfig.variant} className="gap-1">
                                            <RoleIcon className="h-3 w-3" />
                                            {roleConfig.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {member.created_at ? format(new Date(member.created_at), "MMM d, yyyy") : "—"}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            {!isOwner && !isCurrentUser && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon-sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setRemovingMember(member)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remove from org
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Invite Dialog */}
            <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} org={org} />

            {/* Remove Confirmation */}
            <AlertDialog open={!!removingMember} onOpenChange={(o) => !o && setRemovingMember(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove <strong>{removingMember?.profiles?.full_name}</strong> from {org.name}?
                            They will lose access immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleRemove}
                            disabled={isRemoving}
                        >
                            {isRemoving ? "Removing…" : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
