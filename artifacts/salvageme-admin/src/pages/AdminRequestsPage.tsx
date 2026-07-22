import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import { Modal } from "@/components/ui/Modal";
import type { BookRequest } from "@/types";

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || "/";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-300",
  accepted: "bg-moss-50 text-moss-600 border border-moss-300",
  declined: "bg-rose-100 text-rose-700 border border-rose-300",
  cancelled: "bg-paper-200 text-ink-700/60 border border-paper-300",
};

export function AdminRequestsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "requests", { filterStatus, cursorUrl }],
    queryFn: () => apiClient.adminListRequests({ status: filterStatus || undefined, cursorUrl }),
  });

  const columns: Column<BookRequest>[] = [
    {
      key: "id",
      header: "ID",
      render: (r) => <span className="font-mono text-xs text-ink-700/60">#{r.id}</span>,
      className: "w-12",
    },
    {
      key: "listing",
      header: "Listing",
      render: (r) => (
        <a
          href={`${PUBLIC_APP_URL}/listings/${r.listingId}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-terracotta-600 hover:underline no-underline"
        >
          {r.listingTitle}
        </a>
      ),
    },
    { key: "requester", header: "Requester", render: (r) => r.requester.username },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "message",
      header: "Message",
      render: (r) => (
        <span className="block max-w-xs truncate text-ink-700/70">{r.message || "—"}</span>
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
        <h1 className="font-display text-2xl font-bold text-ink-900">Requests</h1>
        <p className="mt-0.5 text-sm text-ink-700/60">
          Read-only — accept/decline remains the listing owner's call.
        </p>
      </div>

      <FilterBar>
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All statuses" },
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "declined", label: "Declined" },
            { value: "cancelled", label: "Cancelled" },
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
        emptyMessage="No requests found."
      />

      {detail && (
        <Modal open onClose={() => setDetail(null)} title={`Request #${detail.id}`}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-700/50">Listing</dt>
              <dd className="mt-0.5">
                <a
                  href={`${PUBLIC_APP_URL}/listings/${detail.listingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-terracotta-600 hover:underline"
                >
                  {detail.listingTitle} →
                </a>
              </dd>
            </div>
            <div><dt className="text-xs text-ink-700/50">Requester</dt><dd className="mt-0.5">{detail.requester.username}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Status</dt><dd className="mt-0.5 capitalize">{detail.status}</dd></div>
            <div>
              <dt className="text-xs text-ink-700/50">Message</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-paper-100 p-3 text-ink-800">
                {detail.message || "—"}
              </dd>
            </div>
            <div><dt className="text-xs text-ink-700/50">Created</dt><dd className="mt-0.5">{fmtDate(detail.createdAt)}</dd></div>
          </dl>
        </Modal>
      )}
    </div>
  );
}
