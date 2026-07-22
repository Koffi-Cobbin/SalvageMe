import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { RefreshCw, Flag, Users, BookOpen, Calendar, ListTodo } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/AdminCan";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export function AdminDashboardPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.adminGetDashboard(),
  });

  const { data: history } = useQuery({
    queryKey: ["admin", "stats-history"],
    queryFn: () => apiClient.adminGetStatsHistory(),
  });

  const recomputeMutation = useMutation({
    mutationFn: () => apiClient.adminRecomputeStats(),
    onSuccess: (stats) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats-history"] });
      push(`Stats recomputed at ${fmtDate(stats.computedAt)}.`, "success");
    },
    onError: (err) => {
      push(err instanceof ApiClientError ? err.message : "Failed to recompute stats.", "error");
    },
  });

  const chartData = (history?.results ?? []).map((s) => ({
    date: fmtDate(s.computedAt),
    Listings: s.totalListings,
    "Exchanges": s.totalExchangesCompleted,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-ink-700/60">Platform overview</p>
        </div>
        <AdminCan capability="stats.recompute">
          <Button
            variant="secondary"
            size="sm"
            loading={recomputeMutation.isPending}
            onClick={() => recomputeMutation.mutate()}
          >
            <RefreshCw size={15} />
            Recompute stats
          </Button>
        </AdminCan>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Open reports"
          value={isLoading ? "—" : (dashboard?.openReportsCount ?? 0)}
          icon={<Flag size={20} />}
          to="/reports"
          highlight={!isLoading && (dashboard?.openReportsCount ?? 0) > 0}
        />
        <StatCard
          label="Pending requests"
          value={isLoading ? "—" : (dashboard?.pendingRequestsCount ?? 0)}
          icon={<ListTodo size={20} />}
        />
        <StatCard
          label="Unverified users"
          value={isLoading ? "—" : (dashboard?.unverifiedUsersCount ?? 0)}
          icon={<Users size={20} />}
          to="/users"
          highlight={!isLoading && (dashboard?.unverifiedUsersCount ?? 0) > 0}
        />
        <StatCard
          label="Listings today"
          value={isLoading ? "—" : (dashboard?.listingsCreatedToday ?? 0)}
          icon={<BookOpen size={20} />}
        />
        <StatCard
          label="Scheduled exchanges"
          value={isLoading ? "—" : (dashboard?.scheduledExchangesCount ?? 0)}
          icon={<Calendar size={20} />}
        />
      </div>

      {/* Trend chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-paper-300 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-ink-900">Growth trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d5" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#7a6e64" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7a6e64" }} />
              <Tooltip contentStyle={{ fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line
                type="monotone"
                dataKey="Listings"
                stroke="#c0714a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Exchanges"
                stroke="#5f8b5a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
