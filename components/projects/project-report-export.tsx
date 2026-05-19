"use client";

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
    Font,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProjectTask {
    id: string;
    title: string;
    status: "todo" | "in_progress" | "done" | "blocked";
    assignee?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
}

interface ProjectReportData {
    projectName: string;
    orgName: string;
    generatedAt: Date;
    summary: {
        total: number;
        done: number;
        inProgress: number;
        todo: number;
        blocked: number;
        completionPct: number;
    };
    tasks: ProjectTask[];
}

// ── PDF Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#1a1a1a",
    },
    header: {
        marginBottom: 24,
        borderBottom: "1 solid #e5e7eb",
        paddingBottom: 16,
    },
    title: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 11,
        color: "#6b7280",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        marginBottom: 8,
        color: "#374151",
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#f9fafb",
        borderRadius: 6,
        padding: 10,
        border: "1 solid #e5e7eb",
    },
    statValue: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 9,
        color: "#6b7280",
    },
    progressBar: {
        height: 8,
        backgroundColor: "#e5e7eb",
        borderRadius: 4,
        marginBottom: 4,
    },
    progressFill: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "#10b981",
    },
    table: {
        border: "1 solid #e5e7eb",
        borderRadius: 6,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: "8 10",
        borderBottom: "1 solid #e5e7eb",
    },
    tableRow: {
        flexDirection: "row",
        padding: "7 10",
        borderBottom: "1 solid #f3f4f6",
    },
    tableRowAlt: {
        backgroundColor: "#fafafa",
    },
    colTitle: { flex: 3 },
    colStatus: { flex: 1.5 },
    colPriority: { flex: 1 },
    colAssignee: { flex: 2 },
    colDue: { flex: 1.5 },
    headerText: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#6b7280",
        textTransform: "uppercase",
    },
    statusBadge: {
        fontSize: 8,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 3,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 9,
        color: "#9ca3af",
        borderTop: "1 solid #e5e7eb",
        paddingTop: 8,
    },
});

const statusColors: Record<ProjectTask["status"], string> = {
    done: "#10b981",
    in_progress: "#3b82f6",
    todo: "#6b7280",
    blocked: "#ef4444",
};

// ── PDF Document ─────────────────────────────────────────────────────────────

function ProjectReportDocument({ data }: { data: ProjectReportData }) {
    const completionWidth = `${Math.round(data.summary.completionPct)}%`;

    return (
        <Document title={`${data.projectName} — Project Report`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{data.projectName}</Text>
                    <Text style={styles.subtitle}>
                        {data.orgName} · Project Report · Generated {format(data.generatedAt, "PPP")}
                    </Text>
                </View>

                {/* Summary stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={styles.statsRow}>
                        {[
                            { label: "Total Tasks", value: data.summary.total, color: "#1a1a1a" },
                            { label: "Completed", value: data.summary.done, color: "#10b981" },
                            { label: "In Progress", value: data.summary.inProgress, color: "#3b82f6" },
                            { label: "Blocked", value: data.summary.blocked, color: "#ef4444" },
                        ].map((s) => (
                            <View key={s.label} style={styles.statCard}>
                                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Completion bar */}
                    <Text style={{ marginBottom: 4, fontSize: 9, color: "#6b7280" }}>
                        Completion: {Math.round(data.summary.completionPct)}%
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: completionWidth }]} />
                    </View>
                </View>

                {/* Tasks table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tasks ({data.tasks.length})</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colTitle, styles.headerText]}>TITLE</Text>
                            <Text style={[styles.colStatus, styles.headerText]}>STATUS</Text>
                            <Text style={[styles.colPriority, styles.headerText]}>PRIORITY</Text>
                            <Text style={[styles.colAssignee, styles.headerText]}>ASSIGNEE</Text>
                            <Text style={[styles.colDue, styles.headerText]}>DUE</Text>
                        </View>
                        {data.tasks.map((task, i) => (
                            <View key={task.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                                <Text style={styles.colTitle}>{task.title}</Text>
                                <Text style={[styles.colStatus, styles.statusBadge, { color: statusColors[task.status] }]}>
                                    {task.status.replace("_", " ")}
                                </Text>
                                <Text style={styles.colPriority}>{task.priority ?? "—"}</Text>
                                <Text style={styles.colAssignee}>{task.assignee ?? "Unassigned"}</Text>
                                <Text style={styles.colDue}>
                                    {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "—"}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text>NexusFlow · {data.orgName}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
}

// ── Export Button ─────────────────────────────────────────────────────────────

interface Props {
    data: ProjectReportData;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg";
}

export function ProjectReportExport({ data, variant = "outline", size = "sm" }: Props) {
    const fileName = `${data.projectName.toLowerCase().replace(/\s+/g, "-")}-report-${format(data.generatedAt, "yyyy-MM-dd")}.pdf`;

    return (
        <PDFDownloadLink
            document={<ProjectReportDocument data={data} />}
            fileName={fileName}
        >
            {({ loading }) => (
                <Button variant={variant} size={size} disabled={loading} className="gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {loading ? "Preparing PDF…" : "Export PDF"}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
