import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterBar, FilterSelect } from "@/components/admin/FilterBar";
import type { AuditLogEntry } from "@/types";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "listing.remove", label: "listing.remove" },
  { value: "listing.restore", label: "listing.restore" },
  { value: "report.resolve", label: "report.resolve" },
  { value: "report.dismiss", label: "report.dismiss" },
  { value: "user.suspend", label: "user.suspend" },
  { value: "user.reactivate", label: "user.reactivate" },
  { value: "role.assign", label: "role.assign" },
  { value: "category.create", label: "category.create" },
  { value: "exchange.force_cancel", label: "exchange.force_cancel" },
  { value: "exchange.force_complete", label: "exchange.force_complete" },
];

const TARGET_OPTIONS = [
  { value: "", label: "All types" },
  { value: "listing", label: "Listing" },
  { value: "user", label: "User" },
  { value: "report", label: "Report" },
  { value: "exchange", label: "Exchange" },
  { value: "category", label: "Category" },
  { value: "role", label: "Role" },
];

function MetadataCell({ entry }: { entry: AuditLogEntry }) {
  const [open, setOpen] = useState(false);
  const hasData = Object.keys(entry.metadata).length > 0;

  if (!hasData) return <span className="text-xs text-ink-700/30">—</span>;

  return (
    <div>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex items-center gap-1 text-xs text-terracotta-600 hover:text-terracotta-700"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {open ? "Hide" : "Show"}
      </button>
      {open && (
        <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-paper-100 p-2 text-xs text-ink-800">
          {JSON.stringify(entry.metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AdminAuditLogPage() {
  const [filterAction, setFilterAction] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", { filterAction, filterTarget, cursorUrl }],
    queryFn: () =>
      apiClient.adminListAuditLog({
        action: filterAction || undefined,
        targetType: filterTarget || undefined,
        cursorUrl,
      }),
  });

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (e) => (
        <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDateTime(e.createdAt)}</span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (e) => <span className="font-medium">{e.actorUsername}</span>,
    },
    {
      key: "action",
      header: "Action",
      render: (e) => (
        <span className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-xs text-paper-100">
          {e.action}
        </span>
      ),
    },
    {
      key: "targetType",
      header: "Target type",
      render: (e) => <span className="capitalize text-ink-700/70">{e.targetType}</span>,
    },
    {
      key: "targetId",
      header: "Target ID",
      render: (e) => <span className="font-mono text-xs text-ink-700/60">#{e.targetId}</span>,
    },
    {
      key: "metadata",
      header: "Metadata",
      render: (e) => <MetadataCell entry={e} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Audit Log</h1>
        <p className="mt-0.5 text-sm text-ink-700/60">Newest-first record of all admin actions.</p>
      </div>

      <FilterBar>
        <FilterSelect
          label="Action"
          value={filterAction}
          onChange={(v) => { setFilterAction(v); setCursorUrl(null); }}
          options={ACTION_OPTIONS}
        />
        <FilterSelect
          label="Target type"
          value={filterTarget}
          onChange={(v) => { setFilterTarget(v); setCursorUrl(null); }}
          options={TARGET_OPTIONS}
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
        emptyMessage="No audit log entries found."
      />
    </div>
  );
}
