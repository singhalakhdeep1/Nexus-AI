"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLORS: Record<string, string> = {
    backlog: "#94a3b8",
    todo: "#64748b",
    in_progress: "#3b82f6",
    in_review: "#a855f7",
    done: "#22c55e",
    cancelled: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
    no_priority: "#94a3b8",
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
    urgent: "#dc2626",
};

function formatLabel(str: string) {
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TaskDistributionChartProps {
    statusData: { name: string; value: number }[];
    priorityData: { name: string; value: number }[];
}

function PieView({ data, colorMap }: { data: { name: string; value: number }[]; colorMap: Record<string, string> }) {
    if (data.every((d) => d.value === 0) || data.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>;
    }
    return (
        <ResponsiveContainer width="100%" height={240}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                >
                    {data.map((entry) => (
                        <Cell key={entry.name} fill={colorMap[entry.name] ?? "#94a3b8"} />
                    ))}
                </Pie>
                <Tooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div className="bg-popover border rounded-lg shadow-md px-3 py-2 text-sm">
                                <p className="font-medium">{formatLabel(payload[0].name as string)}</p>
                                <p className="text-muted-foreground">{payload[0].value} tasks</p>
                            </div>
                        );
                    }}
                />
                <Legend
                    formatter={(value) => <span className="text-xs text-muted-foreground">{formatLabel(value)}</span>}
                    iconSize={8}
                    iconType="circle"
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function TaskDistributionChart({ statusData, priorityData }: TaskDistributionChartProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <Tabs defaultValue="status">
                    <TabsList className="mb-2 h-7 text-xs">
                        <TabsTrigger value="status" className="text-xs">By Status</TabsTrigger>
                        <TabsTrigger value="priority" className="text-xs">By Priority</TabsTrigger>
                    </TabsList>
                    <TabsContent value="status">
                        <PieView data={statusData} colorMap={STATUS_COLORS} />
                    </TabsContent>
                    <TabsContent value="priority">
                        <PieView data={priorityData} colorMap={PRIORITY_COLORS} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
