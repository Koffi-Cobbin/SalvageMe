import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/admin/AdminCan";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterBar, FilterSelect } from "@/components/admin/FilterBar";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import type { AdminReport } from "@/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Inappropriate",
  misrepresented: "Misrepresented",
  no_show: "No-show",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border border-amber-300",
  resolved: "bg-moss-50 text-moss-600 border border-moss-300",
  dismissed: "bg-paper-200 text-ink-700/60 border border-paper-300",
};

export function AdminReportsPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("open");
  const [reason, setReason] = useState("");
  const [targetType, setTargetType] = useState("");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const [detail, setDetail] = useState<AdminReport | null>(null);
  const [pending, setPending] = useState<{ report: AdminReport; action: "resolve" | "dismiss" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", { status, reason, targetType, cursorUrl }],
    queryFn: () =>
      apiClient.adminListReports({
        status: status || undefined,
        reason: reason || undefined,
        targetType: targetType || undefined,
        cursorUrl,
      }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminResolveReport(id),
    onSuccess: () => {
      invalidate();
      push("Report resolved.", "success");
      setPending(null);
      setDetail(null);
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminDismissReport(id),
    onSuccess: () => {
      invalidate();
      push("Report dismissed.", "success");
      setPending(null);
      setDetail(null);
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const columns: Column<AdminReport>[] = [
    {
      key: "id",
      header: "ID",
      render: (r) => <span className="font-mono text-xs text-ink-700/60">#{r.id}</span>,
      className: "w-12",
    },
    {
      key: "target",
      header: "Target",
      render: (r) => (
        <span className="capitalize">
          {r.targetType} #{r.targetId}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => REASON_LABELS[r.reason] ?? r.reason,
    },
    {
      key: "detail",
      header: "Detail",
      render: (r) => (
        <span className="block max-w-xs truncate text-ink-700/70">{r.detail || "—"}</span>
      ),
      className: "max-w-xs",
    },
    {
      key: "filed",
      header: "Filed",
      render: (r) => <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(r.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "open" ? (
          <AdminCan capability="reports.resolve">
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setPending({ report: r, action: "resolve" });
                }}
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setPending({ report: r, action: "dismiss" });
                }}
              >
                Dismiss
              </Button>
            </div>
          </AdminCan>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Reports</h1>

      <FilterBar>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => { setStatus(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All" },
            { value: "open", label: "Open" },
            { value: "resolved", label: "Resolved" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
        <FilterSelect
          label="Reason"
          value={reason}
          onChange={(v) => { setReason(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All reasons" },
            ...Object.entries(REASON_LABELS).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <FilterSelect
          label="Type"
          value={targetType}
          onChange={(v) => { setTargetType(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All types" },
            { value: "listing", label: "Listing" },
            { value: "user", label: "User" },
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
        onRowClick={(r) => setDetail(r)}
        emptyMessage="No reports found."
      />

      {/* Detail modal */}
      {detail && !pending && (
        <Modal open onClose={() => setDetail(null)} title={`Report #${detail.id}`}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">Target</dt>
              <dd className="mt-0.5 capitalize">
                {detail.targetType} #{detail.targetId}
                {detail.targetType === "listing" && (
                  <Link href={`/listings/${detail.targetId}`} className="ml-2 text-terracotta-600 hover:underline text-xs">
                    View listing →
                  </Link>
                )}
                {detail.targetType === "user" && (
                  <Link href={`/admin/users`} className="ml-2 text-terracotta-600 hover:underline text-xs">
                    View in users →
                  </Link>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">Reason</dt>
              <dd className="mt-0.5">{REASON_LABELS[detail.reason] ?? detail.reason}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">Status</dt>
              <dd className="mt-0.5 capitalize">{detail.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">Detail</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-paper-100 p-3 text-ink-800">
                {detail.detail || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">Filed</dt>
              <dd className="mt-0.5">{fmtDate(detail.createdAt)}</dd>
            </div>
          </dl>
          {detail.status === "open" && (
            <AdminCan capability="reports.resolve">
              <div className="mt-5 flex gap-2 border-t border-paper-200 pt-4">
                <Button size="sm" onClick={() => setPending({ report: detail, action: "resolve" })}>
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPending({ report: detail, action: "dismiss" })}
                >
                  Dismiss
                </Button>
              </div>
            </AdminCan>
          )}
        </Modal>
      )}

      {/* Resolve confirm */}
      <ActionModal
        open={pending?.action === "resolve"}
        onClose={() => setPending(null)}
        onConfirm={() => pending && resolveMutation.mutate(pending.report.id)}
        title="Resolve report"
        description={`Mark report #${pending?.report.id} as resolved?`}
        confirmLabel="Resolve"
        confirmVariant="primary"
        loading={resolveMutation.isPending}
      />

      {/* Dismiss confirm */}
      <ActionModal
        open={pending?.action === "dismiss"}
        onClose={() => setPending(null)}
        onConfirm={() => pending && dismissMutation.mutate(pending.report.id)}
        title="Dismiss report"
        description={`Mark report #${pending?.report.id} as dismissed without action?`}
        confirmLabel="Dismiss"
        loading={dismissMutation.isPending}
      />
    </div>
  );
}
