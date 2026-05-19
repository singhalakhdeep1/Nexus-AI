"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VelocityChartProps {
    data: { week: string; completed: number }[];
}

export function VelocityChart({ data }: VelocityChartProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Weekly Velocity</CardTitle>
                <p className="text-xs text-muted-foreground">Tasks completed per week (last 8 weeks)</p>
            </CardHeader>
            <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                            dataKey="week"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            className="text-muted-foreground"
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-popover border rounded-lg shadow-md px-3 py-2 text-sm">
                                        <p className="font-medium mb-1">{label}</p>
                                        <p className="text-muted-foreground">
                                            <span className="text-foreground font-semibold">{payload[0].value}</span> tasks completed
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="completed" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
