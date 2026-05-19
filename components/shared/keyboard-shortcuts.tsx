"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
    {
        category: "Navigation",
        items: [
            { keys: ["⌘", "K"], label: "Open command palette" },
            { keys: ["G", "H"], label: "Go to home / dashboard" },
            { keys: ["G", "P"], label: "Go to projects" },
            { keys: ["G", "N"], label: "Go to notifications" },
            { keys: ["G", "S"], label: "Go to settings" },
        ],
    },
    {
        category: "Tasks",
        items: [
            { keys: ["N"], label: "Create new task" },
            { keys: ["⌘", "Enter"], label: "Save / submit form" },
            { keys: ["Esc"], label: "Close dialog / cancel" },
        ],
    },
    {
        category: "Views",
        items: [
            { keys: ["⌘", "\\"], label: "Toggle sidebar" },
            { keys: ["?"], label: "Show keyboard shortcuts" },
        ],
    },
];

interface KeyboardShortcutsProps {
    trigger?: React.ReactNode;
}

export function KeyboardShortcuts({ trigger }: KeyboardShortcutsProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Keyboard className="h-4 w-4" />
                        Shortcuts
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 mt-2">
                    {SHORTCUTS.map((section) => (
                        <div key={section.category}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {section.category}
                            </p>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between py-1">
                                        <span className="text-sm text-foreground">{item.label}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key) => (
                                                <kbd
                                                    key={key}
                                                    className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator className="mt-3" />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
