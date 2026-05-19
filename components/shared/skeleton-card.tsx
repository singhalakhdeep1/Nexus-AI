import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TaskCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("p-3 rounded-lg border bg-card space-y-2", className)}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-5 rounded-full ml-auto" />
            </div>
        </div>
    );
}

export function ProjectCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("p-4 rounded-xl border bg-card space-y-3", className)}>
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    );
}

export function StatCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("p-4 rounded-xl border bg-card space-y-2", className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
        </div>
    );
}

export function KanbanColumnSkeleton() {
    return (
        <div className="w-72 shrink-0 space-y-2">
            <div className="flex items-center gap-2 px-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-6 rounded-full ml-auto" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
            ))}
        </div>
    );
}
