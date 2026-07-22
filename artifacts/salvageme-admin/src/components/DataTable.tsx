import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  nextCursorUrl?: string | null;
  previousCursorUrl?: string | null;
  onNext?: () => void;
  onPrev?: () => void;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  nextCursorUrl,
  previousCursorUrl,
  onNext,
  onPrev,
  emptyMessage = "No results found.",
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-paper-300 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-200 bg-paper-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-700/70 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-ink-700/50"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-paper-100 last:border-0 transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-terracotta-50/40" : "hover:bg-paper-50/60"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-ink-800 ${col.className ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(nextCursorUrl || previousCursorUrl) && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!previousCursorUrl}
            onClick={onPrev}
          >
            <ChevronLeft size={15} /> Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!nextCursorUrl}
            onClick={onNext}
          >
            Next <ChevronRight size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}
