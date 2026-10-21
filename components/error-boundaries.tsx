"use client";

/**
 * NexusFlow — Error boundaries for crash-prone sub-trees.
 *
 * Kanban (dnd-kit), Three.js analytics and Tiptap editor are the most
 * likely crash points. Each has its own boundary with a meaningful fallback.
 *
 * Skill coverage: react-error-boundary v5, production resilience patterns
 */

import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { AlertTriangle, RefreshCw, Kanban, BarChart3, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";

function ErrorFallback({ error, resetErrorBoundary, icon: Icon, label }: FallbackProps & {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5"
        >
            <Icon className="h-8 w-8 text-destructive/60" />
            <div className="space-y-1">
                <p className="font-semibold text-sm text-destructive">{label} crashed</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                    {error?.message ?? "An unexpected error occurred. Your data is safe — nothing was lost."}
                </p>
            </div>
            <Button size="sm" variant="outline" onClick={resetErrorBoundary} className="gap-2 mt-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Reload {label}
            </Button>
        </div>
    );
}

// ── Kanban board error boundary ───────────────────────────────────────────────

export function KanbanErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            fallbackRender={(props) => (
                <ErrorFallback {...props} icon={Kanban} label="Kanban Board" />
            )}
            onError={(error) => console.error("[KanbanErrorBoundary]", error)}
        >
            {children}
        </ErrorBoundary>
    );
}

// ── Analytics / Three.js chart error boundary ────────────────────────────────

export function AnalyticsErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            fallbackRender={(props) => (
                <ErrorFallback {...props} icon={BarChart3} label="Analytics" />
            )}
            onError={(error) => console.error("[AnalyticsErrorBoundary]", error)}
        >
            {children}
        </ErrorBoundary>
    );
}

// ── Tiptap rich-text editor error boundary ────────────────────────────────────

export function EditorErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            fallbackRender={(props) => (
                <ErrorFallback {...props} icon={FileEdit} label="Editor" />
            )}
            onError={(error) => console.error("[EditorErrorBoundary]", error)}
        >
            {children}
        </ErrorBoundary>
    );
}

// ── Generic page-level boundary ──────────────────────────────────────────────

export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            fallbackRender={(props) => (
                <ErrorFallback {...props} icon={AlertTriangle} label="Page" />
            )}
            onError={(error) => console.error("[PageErrorBoundary]", error)}
        >
            {children}
        </ErrorBoundary>
    );
}
