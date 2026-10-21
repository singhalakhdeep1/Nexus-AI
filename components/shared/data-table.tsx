"use client";

import React, { useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    ArrowUpDown, ArrowUp, ArrowDown,
    ChevronLeft, ChevronRight, Search,
    SlidersHorizontal, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuItem,
    DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    pageSize?: number;
    className?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search…",
    pageSize = 15,
    className,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnFilters, columnVisibility },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize } },
    });

    return (
        <div className={cn("space-y-3", className)}>
            {/* Toolbar */}
            <div className="flex items-center gap-2">
                {searchKey && (
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                )}

                {/* Column visibility toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs ml-auto">
                            <Eye className="w-3.5 h-3.5" />
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((col) => col.getCanHide())
                            .map((col) => (
                                <DropdownMenuItem
                                    key={col.id}
                                    onClick={() => col.toggleVisibility(!col.getIsVisible())}
                                    className="capitalize text-sm"
                                >
                                    {col.id}
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <button
                                                className={cn(
                                                    "flex items-center gap-1",
                                                    header.column.getCanSort() && "cursor-pointer hover:text-foreground transition-colors"
                                                )}
                                                onClick={header.column.getCanSort()
                                                    ? header.column.getToggleSortingHandler()
                                                    : undefined}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    header.column.getIsSorted() === "asc"
                                                        ? <ArrowUp className="w-3 h-3" />
                                                        : header.column.getIsSorted() === "desc"
                                                            ? <ArrowDown className="w-3 h-3" />
                                                            : <ArrowUpDown className="w-3 h-3 opacity-40" />
                                                )}
                                            </button>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-border">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-10 text-muted-foreground text-sm">
                                    No tasks found.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    data-state={row.getIsSelected() ? "selected" : undefined}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-3 py-2.5">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} tasks
                </span>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
                        «
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="px-2">
                        Page {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
                        »
                    </Button>
                </div>
            </div>
        </div>
    );
}
