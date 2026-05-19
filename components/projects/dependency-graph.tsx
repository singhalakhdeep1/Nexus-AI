"use client";

import React, { useCallback } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type Connection,
    type NodeTypes,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch } from "lucide-react";

// ── Custom task node ────────────────────────────────────────────────────────

interface TaskNodeData {
    label: string;
    status: "todo" | "in_progress" | "done" | "blocked";
    assignee?: string;
    priority?: "low" | "medium" | "high";
}

const statusColors: Record<TaskNodeData["status"], string> = {
    todo: "border-border bg-muted/30",
    in_progress: "border-blue-500/60 bg-blue-500/10",
    done: "border-green-500/60 bg-green-500/10",
    blocked: "border-red-500/60 bg-red-500/10",
};

const priorityDot: Record<NonNullable<TaskNodeData["priority"]>, string> = {
    low: "bg-muted-foreground",
    medium: "bg-yellow-500",
    high: "bg-red-500",
};

function TaskNode({ data }: { data: TaskNodeData }) {
    return (
        <div className={`rounded-lg border px-3 py-2 min-w-[140px] max-w-[180px] text-sm shadow-sm ${statusColors[data.status]}`}>
            <div className="flex items-start gap-1.5">
                {data.priority && (
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityDot[data.priority]}`} />
                )}
                <p className="font-medium leading-snug text-foreground line-clamp-2">{data.label}</p>
            </div>
            {data.assignee && (
                <p className="mt-1 text-[11px] text-muted-foreground truncate">{data.assignee}</p>
            )}
        </div>
    );
}

const nodeTypes: NodeTypes = { task: TaskNode };

// ── Component ───────────────────────────────────────────────────────────────

interface ProjectFlowProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
    readOnly?: boolean;
    className?: string;
}

const defaultNodes: Node[] = [
    { id: "1", type: "task", position: { x: 50, y: 120 }, data: { label: "Design system setup", status: "done", priority: "high", assignee: "Alice" } },
    { id: "2", type: "task", position: { x: 300, y: 40 }, data: { label: "Authentication flow", status: "done", priority: "high", assignee: "Bob" } },
    { id: "3", type: "task", position: { x: 300, y: 200 }, data: { label: "Database schema", status: "done", priority: "high", assignee: "Alice" } },
    { id: "4", type: "task", position: { x: 560, y: 40 }, data: { label: "Dashboard UI", status: "in_progress", priority: "medium", assignee: "Charlie" } },
    { id: "5", type: "task", position: { x: 560, y: 200 }, data: { label: "API endpoints", status: "in_progress", priority: "high", assignee: "Bob" } },
    { id: "6", type: "task", position: { x: 810, y: 120 }, data: { label: "E2E tests", status: "todo", priority: "medium", assignee: "Alice" } },
    { id: "7", type: "task", position: { x: 560, y: 340 }, data: { label: "Notifications service", status: "blocked", priority: "medium", assignee: "Charlie" } },
];

const defaultEdges: Edge[] = [
    { id: "e1-2", source: "1", target: "2", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e1-3", source: "1", target: "3", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e2-4", source: "2", target: "4", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e3-5", source: "3", target: "5", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e4-6", source: "4", target: "6", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e5-6", source: "5", target: "6", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e3-7", source: "3", target: "7", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "hsl(var(--destructive))" } },
];

export function ProjectDependencyGraph({
    initialNodes = defaultNodes,
    initialEdges = defaultEdges,
    readOnly = false,
    className,
}: ProjectFlowProps) {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges]
    );

    return (
        <div className={`relative rounded-xl border border-border overflow-hidden bg-background ${className ?? "h-[400px]"}`}>
            {/* Header */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                Dependency Graph
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={readOnly ? undefined : onNodesChange}
                onEdgesChange={readOnly ? undefined : onEdgesChange}
                onConnect={readOnly ? undefined : onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={20} size={1} color="hsl(var(--border))" />
                <Controls showInteractive={!readOnly} className="[&>button]:bg-background [&>button]:border-border [&>button]:text-foreground" />
                <MiniMap
                    nodeColor={(n) => {
                        const s = (n.data as TaskNodeData).status;
                        return s === "done" ? "#4ade80" : s === "in_progress" ? "#60a5fa" : s === "blocked" ? "#f87171" : "hsl(var(--muted))";
                    }}
                    className="!bg-background !border-border rounded-lg overflow-hidden"
                />
            </ReactFlow>

            {/* Legend */}
            <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-2.5 py-2 text-[11px]">
                {[
                    { label: "Done", color: "bg-green-500/60" },
                    { label: "In Progress", color: "bg-blue-500/60" },
                    { label: "Blocked", color: "bg-red-500/60" },
                    { label: "Todo", color: "bg-muted" },
                ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                        <span className="text-muted-foreground">{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
