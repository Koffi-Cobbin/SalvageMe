import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/AdminCan";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import { ActionModal } from "@/components/ActionModal";
import { Button } from "@/components/ui";
import type { Exchange } from "@/types";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-50 text-amber-700 border border-amber-300",
  completed: "bg-moss-50 text-moss-600 border border-moss-300",
  cancelled: "bg-paper-200 text-ink-700/60 border border-paper-300",
  no_show: "bg-rose-100 text-rose-700 border border-rose-300",
};

type OverrideKind = "force-cancel" | "force-complete";

export function AdminExchangesPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const [pending, setPending] = useState<{ exchange: Exchange; kind: OverrideKind } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exchanges", { filterStatus, cursorUrl }],
    queryFn: () => apiClient.adminListExchanges({ status: filterStatus || undefined, cursorUrl }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "exchanges"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  const forceCancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.adminForceCancelExchange(id, reason),
    onSuccess: () => {
      invalidate();
      push("Exchange force-cancelled.", "success");
      setPending(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && err.code === "invalid_transition"
          ? "This exchange isn't in a state that can be force-overridden."
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  const forceCompleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.adminForceCompleteExchange(id, reason),
    onSuccess: () => {
      invalidate();
      push("Exchange force-completed.", "success");
      setPending(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && err.code === "invalid_transition"
          ? "This exchange isn't in a state that can be force-overridden."
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  const columns: Column<Exchange>[] = [
    {
      key: "id",
      header: "ID",
      render: (e) => <span className="font-mono text-xs text-ink-700/60">#{e.id}</span>,
      className: "w-12",
    },
    {
      key: "listing",
      header: "Listing",
      render: (e) => <span className="font-medium">{e.listingTitle}</span>,
    },
    { key: "donor", header: "Donor", render: (e) => e.donor.username },
    { key: "recipient", header: "Recipient", render: (e) => e.recipient.username },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[e.status] ?? ""}`}
        >
          {e.status.replace("_", "-")}
        </span>
      ),
    },
    {
      key: "scheduled",
      header: "Scheduled at",
      render: (e) => (
        <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(e.scheduledAt)}</span>
      ),
    },
    {
      key: "completed",
      header: "Completed at",
      render: (e) => (
        <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(e.completedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (e) =>
        e.status === "scheduled" ? (
          <AdminCan capability="exchanges.force_override">
            <div className="flex gap-1.5" onClick={(ev) => ev.stopPropagation()}>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setPending({ exchange: e, kind: "force-cancel" })}
              >
                Force cancel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPending({ exchange: e, kind: "force-complete" })}
              >
                Force complete
              </Button>
            </div>
          </AdminCan>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Exchanges</h1>

      <FilterBar>
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setCursorUrl(null);
          }}
          options={[
            { value: "", label: "All statuses" },
            { value: "scheduled", label: "Scheduled" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "no_show", label: "No-show" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.results ?? []}
        isLoading={isLoading}
        nextCursorUrl={data?.nextCursorUrl}
        previousCursorUrl={data?.previousCursorUrl}
        onNext={() => setCursorUrl(data!.nextCursorUrl)}
        onPrev={() => setCursorUrl(data!.previousCursorUrl)}
        emptyMessage="No exchanges found."
      />

      <ActionModal
        open={pending?.kind === "force-cancel"}
        onClose={() => setPending(null)}
        onConfirm={(reason) =>
          pending && forceCancelMutation.mutate({ id: pending.exchange.id, reason: reason! })
        }
        title="Force-cancel exchange"
        description={`Exchange #${pending?.exchange.id} — ${pending?.exchange.donor.username} → ${pending?.exchange.recipient.username}.`}
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="Explain why this exchange is being force-cancelled…"
        confirmLabel="Force cancel"
        loading={forceCancelMutation.isPending}
      />

      <ActionModal
        open={pending?.kind === "force-complete"}
        onClose={() => setPending(null)}
        onConfirm={(reason) =>
          pending && forceCompleteMutation.mutate({ id: pending.exchange.id, reason: reason! })
        }
        title="Force-complete exchange"
        description={`Exchange #${pending?.exchange.id} — ${pending?.exchange.donor.username} → ${pending?.exchange.recipient.username}.`}
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="Explain why this exchange is being force-completed…"
        confirmLabel="Force complete"
        confirmVariant="primary"
        loading={forceCompleteMutation.isPending}
      />
    </div>
  );
}
