import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import type { Rating } from "@/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StarDisplay({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= score ? "fill-amber-400 text-amber-400" : "text-paper-300"}
        />
      ))}
    </span>
  );
}

export function AdminRatingsPage() {
  const [filterScore, setFilterScore] = useState<number | null>(null);
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "ratings", { filterScore, cursorUrl }],
    queryFn: () => apiClient.adminListRatings({ score: filterScore ?? undefined, cursorUrl }),
  });

  const columns: Column<Rating>[] = [
    {
      key: "id",
      header: "ID",
      render: (r) => <span className="font-mono text-xs text-ink-700/60">#{r.id}</span>,
      className: "w-12",
    },
    { key: "ratedUser", header: "Rated user", render: (r) => `User #${r.ratedUserId}` },
    { key: "ratedBy", header: "Rated by", render: (r) => `User #${r.ratedById}` },
    {
      key: "exchange",
      header: "Exchange",
      render: (r) => <span className="text-xs text-ink-700/60">#{r.exchangeId}</span>,
    },
    {
      key: "score",
      header: "Score",
      render: (r) => <StarDisplay score={r.score} />,
    },
    {
      key: "comment",
      header: "Comment",
      render: (r) => (
        <span className="block max-w-xs truncate text-ink-700/70">{r.comment || "—"}</span>
      ),
      className: "max-w-xs",
    },
    {
      key: "created",
      header: "Created",
      render: (r) => <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Ratings</h1>
        <p className="mt-0.5 text-sm text-ink-700/60">Read-only — trust &amp; safety review.</p>
      </div>

      <FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-700/70">Score</span>
          <div className="flex gap-1">
            {[null, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n ?? "all"}
                onClick={() => { setFilterScore(n); setCursorUrl(null); }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
                  filterScore === n
                    ? "border-terracotta-400 bg-terracotta-50 text-terracotta-600 font-semibold"
                    : "border-paper-300 bg-white text-ink-700 hover:bg-paper-100"
                }`}
              >
                {n === null ? "All" : n}
              </button>
            ))}
          </div>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.results ?? []}
        isLoading={isLoading}
        nextCursorUrl={data?.nextCursorUrl}
        previousCursorUrl={data?.previousCursorUrl}
        onNext={() => setCursorUrl(data!.nextCursorUrl)}
        onPrev={() => setCursorUrl(data!.previousCursorUrl)}
        emptyMessage="No ratings found."
      />
    </div>
  );
}
