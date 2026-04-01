"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { Spinner } from "./Spinner";

type SortDirection = "asc" | "desc";

export type TableColumn<T> = {
  key: keyof T | string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  sortValue?: (row: T) => string | number | Date | null | undefined;
};

export type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => string;
  emptyMessage?: string;
};

function toComparableValue(value: string | number | Date | null | undefined): number | string {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return "";
}

/**
 * Tableau générique léger avec tri, pagination simple et état vide.
 */
export function Table<T>({
  data,
  columns,
  loading = false,
  pageSize = 10,
  onRowClick,
  rowKey,
  emptyMessage = "Aucune donnée disponible.",
}: TableProps<T>): JSX.Element {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data;
    }

    const column = columns.find((entry) => String(entry.key) === sortKey);

    if (!column) {
      return data;
    }

    return [...data].sort((firstRow, secondRow) => {
      const firstRaw = column.sortValue
        ? column.sortValue(firstRow)
        : firstRow[column.key as keyof T];
      const secondRaw = column.sortValue
        ? column.sortValue(secondRow)
        : secondRow[column.key as keyof T];

      const firstValue = toComparableValue(
        firstRaw instanceof Date || typeof firstRaw === "number" || typeof firstRaw === "string"
          ? firstRaw
          : null
      );
      const secondValue = toComparableValue(
        secondRaw instanceof Date || typeof secondRaw === "number" || typeof secondRaw === "string"
          ? secondRaw
          : null
      );

      if (firstValue < secondValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (firstValue > secondValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [columns, data, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const paginatedData = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;

    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [page, pageSize, sortedData, totalPages]);

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    const nextKey = String(column.key);

    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  };

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) {
      return null;
    }

    const columnKey = String(column.key);

    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-400" />;
    }

    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 text-[#1B4332]" />
    ) : (
      <ChevronDown className="h-4 w-4 text-[#1B4332]" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.className
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      column.sortable ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <span>{column.header}</span>
                    {renderSortIcon(column)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: pageSize }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`}>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Chargement...
                      </span>
                    </td>
                  </tr>
                ))
              : null}

            {!loading && paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {!loading
              ? paginatedData.map((row, index) => (
                  <tr
                    key={rowKey ? rowKey(row, index) : `${index}`}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-[#1B4332]/[0.03]"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => {
                      const cellValue = row[column.key as keyof T];

                      return (
                        <td
                          key={String(column.key)}
                          className={cn("px-4 py-4 text-sm text-slate-700", column.className)}
                        >
                          {column.render
                            ? column.render(row)
                            : typeof cellValue === "string" || typeof cellValue === "number"
                              ? cellValue
                              : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
          <span>
            Page {Math.min(page, totalPages)} sur {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

