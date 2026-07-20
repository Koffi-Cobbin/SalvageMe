import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterBar, FilterSelect } from "@/components/admin/FilterBar";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import type { PartnerApplication, AdminRole } from "@/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-300",
  approved: "bg-moss-50 text-moss-600 border border-moss-300",
  rejected: "bg-rose-100 text-rose-700 border border-rose-300",
};

type ModalKind = "detail" | "approve" | "reject";

export function AdminPartnerApplicationsPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("pending");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const [selected, setSelected] = useState<PartnerApplication | null>(null);
  const [modal, setModal] = useState<ModalKind | null>(null);

  const [approveRoleId, setApproveRoleId] = useState("");
  const [approveDropoff, setApproveDropoff] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partner-applications", { filterStatus, cursorUrl }],
    queryFn: () =>
      apiClient.adminListPartnerApplications({ status: filterStatus || undefined, cursorUrl }),
  });

  const { data: roles } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiClient.listAdminRoles(),
    enabled: modal === "approve",
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "partner-applications"] });
  }

  function openApprove(app: PartnerApplication) {
    setSelected(app);
    setApproveRoleId("");
    setApproveDropoff(!!app.proposedDropoffName);
    setModal("approve");
  }

  const approveMutation = useMutation({
    mutationFn: ({ id, roleId, assignDropoff }: { id: string; roleId: number; assignDropoff: boolean }) =>
      apiClient.adminApprovePartnerApplication(id, {
        adminRoleId: roleId,
        assignDropoffManager: assignDropoff,
      }),
    onSuccess: () => {
      invalidate();
      push("Application approved.", "success");
      setModal(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && err.code === "already_reviewed"
          ? "This application has already been reviewed."
          : err instanceof ApiClientError && err.code === "email_not_verified"
          ? "The applicant hasn't verified their email yet — wait for them to complete that step."
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.adminRejectPartnerApplication(id, reason),
    onSuccess: () => {
      invalidate();
      push("Application rejected.", "success");
      setModal(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && err.code === "already_reviewed"
          ? "This application has already been reviewed."
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  const columns: Column<PartnerApplication>[] = [
    {
      key: "id",
      header: "ID",
      render: (a) => <span className="font-mono text-xs text-ink-700/60">#{a.id}</span>,
      className: "w-12",
    },
    { key: "name", header: "Applicant", render: (a) => <span className="font-medium">{a.applicantName}</span> },
    { key: "email", header: "Email", render: (a) => <span className="text-ink-700/70">{a.applicantEmail}</span> },
    { key: "org", header: "Organisation", render: (a) => a.organizationName ?? <span className="text-ink-700/30">—</span> },
    {
      key: "dropoff",
      header: "Drop-off proposed",
      render: (a) => a.proposedDropoffName ?? <span className="text-ink-700/30">—</span>,
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (a) => <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(a.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[a.status] ?? ""}`}>
          {a.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (a) =>
        a.status === "pending" ? (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={() => openApprove(a)}>Approve</Button>
            <Button size="sm" variant="ghost" onClick={() => { setSelected(a); setModal("reject"); }}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Partner Applications</h1>

      <FilterBar>
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
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
        onRowClick={(a) => { setSelected(a); setModal("detail"); }}
        emptyMessage="No partner applications found."
      />

      {/* Detail modal */}
      {selected && modal === "detail" && (
        <Modal open onClose={() => setModal(null)} title={`Application #${selected.id} — ${selected.applicantName}`}>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-ink-700/50">Email</dt><dd className="mt-0.5">{selected.applicantEmail}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Phone</dt><dd className="mt-0.5">{selected.applicantPhone ?? "—"}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Organisation</dt><dd className="mt-0.5">{selected.organizationName ?? "—"}</dd></div>
            {selected.proposedDropoffName && (
              <div>
                <dt className="text-xs text-ink-700/50">Proposed drop-off</dt>
                <dd className="mt-0.5">{selected.proposedDropoffName} — {selected.proposedDropoffAddress}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-ink-700/50">Message</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-paper-100 p-3 text-ink-800">{selected.message ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-700/50">Email verified</dt>
              <dd className="mt-0.5">{selected.emailVerifiedAt ? fmtDate(selected.emailVerifiedAt) : "Not verified"}</dd>
            </div>
            <div><dt className="text-xs text-ink-700/50">Status</dt><dd className="mt-0.5 capitalize">{selected.status}</dd></div>
            {selected.rejectionReason && (
              <div><dt className="text-xs text-ink-700/50">Rejection reason</dt><dd className="mt-0.5">{selected.rejectionReason}</dd></div>
            )}
          </dl>
          {selected.status === "pending" && (
            <div className="mt-5 flex gap-2 border-t border-paper-200 pt-4">
              <Button size="sm" onClick={() => openApprove(selected)}>Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => setModal("reject")}>Reject</Button>
            </div>
          )}
        </Modal>
      )}

      {/* Approve modal */}
      {selected && modal === "approve" && (
        <Modal open onClose={() => setModal(null)} title={`Approve — ${selected.applicantName}`}>
          <div className="space-y-4">
            <p className="text-sm text-ink-700/70">
              This will grant the selected role to {selected.applicantName}'s account
              {approveDropoff && selected.proposedDropoffName
                ? ` and create a new drop-off point at ${selected.proposedDropoffAddress}.`
                : "."}
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Admin role <span className="text-terracotta-500">*</span>
              </label>
              <select
                value={approveRoleId}
                onChange={(e) => setApproveRoleId(e.target.value)}
                className="w-full rounded-lg border border-paper-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              >
                <option value="">— Select a role —</option>
                {(roles ?? []).map((r: AdminRole) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {selected.proposedDropoffName && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={approveDropoff}
                  onChange={(e) => setApproveDropoff(e.target.checked)}
                  className="rounded"
                />
                Also create drop-off point at {selected.proposedDropoffAddress}
              </label>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!approveRoleId}
                loading={approveMutation.isPending}
                onClick={() =>
                  approveMutation.mutate({
                    id: selected.id,
                    roleId: Number(approveRoleId),
                    assignDropoff: approveDropoff,
                  })
                }
              >
                Approve
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      <ActionModal
        open={modal === "reject"}
        onClose={() => setModal(null)}
        onConfirm={(reason) => selected && rejectMutation.mutate({ id: selected.id, reason: reason! })}
        title="Reject application"
        description={`Reject ${selected?.applicantName}'s partner application.`}
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="Explain why the application is being rejected…"
        confirmLabel="Reject"
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
