"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";

// ---- Types ----

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  /** Unique key — also used as sort key if sortable */
  key: string;
  header: string;
  /** Render cell content. Receives the row object. */
  cell: (row: T) => ReactNode;
  /** Whether this column is sortable. Default false. */
  sortable?: boolean;
  /** Column width class e.g. 'w-32', 'w-1/4' */
  width?: string;
  /** Additional th/td class */
  className?: string;
  /** Align cell content. Default 'left'. */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  /** Key extractor for React list keys */
  rowKey: (row: T) => string;
  /** Called when header is clicked (sortable columns only) */
  onSort?: (key: string, direction: SortDirection) => void;
  sortKey?: string;
  sortDirection?: SortDirection;
  /** Pagination */
  page?: number;
  perPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** Empty state customisation */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  className?: string;
}

// ---- Skeleton ----

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 rounded bg-slate-100 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---- Sort icon ----

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
  if (direction === "desc") return <ChevronDown className="h-3.5 w-3.5" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
}

// ---- DataTable ----

export function DataTable<T>({
  columns,
  data,
  isLoading,
  rowKey,
  onSort,
  sortKey,
  sortDirection,
  page = 1,
  perPage = 20,
  total,
  onPageChange,
  emptyTitle = "Tidak ada data",
  emptyDescription = "Belum ada data yang tersedia.",
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{
    key: string;
    dir: SortDirection;
  }>({ key: "", dir: null });

  const activeSortKey = sortKey ?? internalSort.key;
  const activeSortDir = sortDirection ?? internalSort.dir;

  function handleSort(colKey: string) {
    let next: SortDirection;
    if (activeSortKey !== colKey) next = "asc";
    else if (activeSortDir === "asc") next = "desc";
    else next = null;

    setInternalSort({ key: colKey, dir: next });
    onSort?.(colKey, next);
  }

  const totalPages = total ? Math.ceil(total / perPage) : undefined;

  const alignClass = (align: Column<T>["align"] = "left") =>
    ({
      left: "text-left",
      center: "text-center",
      right: "text-right",
    })[align];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 font-medium text-slate-600",
                    alignClass(col.align),
                    col.width,
                    col.className,
                    col.sortable &&
                      "cursor-pointer select-none hover:text-slate-900",
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        direction={
                          activeSortKey === col.key ? activeSortDir : null
                        }
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableSkeleton cols={columns.length} />
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "transition-colors hover:bg-slate-50",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-slate-700",
                        alignClass(col.align),
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(totalPages ?? 0) > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">
            Halaman {page} dari {totalPages}
            {total && ` · ${total} total`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages ?? 1, 5) }).map(
              (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm",
                      p === page
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {p}
                  </button>
                );
              },
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={!totalPages || page >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
