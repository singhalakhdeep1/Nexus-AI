"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";

const inviteSchema = z.object({
    email: z.string().email("Valid email required"),
    role: z.enum(["member", "admin"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    org: { id: string; name: string; slug: string };
}

export function InviteMemberDialog({ open, onOpenChange, org }: InviteMemberDialogProps) {
    const { addToast } = useToast();
    const [isSending, setIsSending] = useState(false);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InviteForm>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { email: "", role: "member" },
    });

    const onSubmit = async (data: InviteForm) => {
        setIsSending(true);
        try {
            const res = await fetch("/api/email/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, orgId: org.id, orgName: org.name, orgSlug: org.slug }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to send invite");
            }

            addToast({ title: "Invite sent!", description: `An invitation was sent to ${data.email}.`, type: "success" });
            reset();
            onOpenChange(false);
        } catch (err: any) {
            addToast({ title: "Failed to send invite", description: err.message, type: "error" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite to {org.name}</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to add someone to your workspace.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-email">Email address</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            placeholder="colleague@company.com"
                            {...register("email")}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Role</Label>
                        <Select value={watch("role")} onValueChange={(v) => setValue("role", v as "member" | "admin")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member — Can view and edit tasks</SelectItem>
                                <SelectItem value="admin">Admin — Can manage members and settings</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSending}>
                            <Send className="h-4 w-4 mr-2" />
                            {isSending ? "Sending…" : "Send Invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
