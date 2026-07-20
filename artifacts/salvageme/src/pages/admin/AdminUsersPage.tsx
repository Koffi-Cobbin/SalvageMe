import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/admin/AdminCan";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterBar, FilterSelect } from "@/components/admin/FilterBar";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button, Input } from "@/components/ui";
import { VerifiedBadge } from "@/components/ui/Badge";
import type { AdminUser, AdminRole } from "@/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type ModalKind = "detail" | "edit" | "suspend" | "reactivate" | "assign-role";

export function AdminUsersPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [search, setSearch] = useState("");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [modal, setModal] = useState<ModalKind | null>(null);

  // Edit form state
  const [editRole, setEditRole] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editVerified, setEditVerified] = useState(false);

  // Assign role form state
  const [assignRoleId, setAssignRoleId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { filterRole, filterVerified, filterActive, cursorUrl }],
    queryFn: () =>
      apiClient.adminListUsers({
        role: filterRole || undefined,
        isVerified: filterVerified === "" ? undefined : filterVerified === "true",
        isActive: filterActive === "" ? undefined : filterActive === "true",
        cursorUrl,
      }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiClient.listAdminRoles(),
    enabled: modal === "assign-role",
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  function openModal(user: AdminUser, kind: ModalKind) {
    setSelected(user);
    setModal(kind);
    if (kind === "edit") {
      setEditRole(user.role);
      setEditPhone(user.phone ?? "");
      setEditVerified(user.isVerified);
    }
    if (kind === "assign-role") {
      setAssignRoleId(user.adminRole?.id ?? "");
    }
  }

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminSuspendUser(id),
    onSuccess: () => { invalidate(); push("User suspended.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminReactivateUser(id),
    onSuccess: () => { invalidate(); push("User reactivated.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { role?: string; phone?: string; isVerified?: boolean } }) =>
      apiClient.adminUpdateUser(id, patch),
    onSuccess: () => { invalidate(); push("User updated.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string | null }) =>
      apiClient.adminAssignRole(userId, roleId),
    onSuccess: () => { invalidate(); push("Role assigned.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const visibleRows = (data?.results ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const columns: Column<AdminUser>[] = [
    { key: "username", header: "Username", render: (u) => <span className="font-medium">{u.username}</span> },
    { key: "email", header: "Email", render: (u) => <span className="text-ink-700/70">{u.email}</span> },
    { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
    {
      key: "verified",
      header: "Verified",
      render: (u) => u.isVerified ? <VerifiedBadge /> : <span className="text-xs text-ink-700/50">No</span>,
    },
    {
      key: "active",
      header: "Active",
      render: (u) => (
        <span className={`text-xs font-medium ${u.isActive ? "text-moss-600" : "text-rose-600"}`}>
          {u.isActive ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "adminRole",
      header: "Admin role",
      render: (u) => u.adminRole ? (
        <span className="text-xs text-ink-700/80">{u.adminRole.name}</span>
      ) : (
        <span className="text-xs text-ink-700/30">—</span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (u) => <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(u.dateJoined)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <AdminCan capability="users.suspend">
            {u.isActive ? (
              <Button size="sm" variant="ghost" onClick={() => openModal(u, "suspend")}>
                <ShieldOff size={13} /> Suspend
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => openModal(u, "reactivate")}>
                <ShieldCheck size={13} /> Reactivate
              </Button>
            )}
          </AdminCan>
          <AdminCan capability="users.edit">
            <Button size="sm" variant="secondary" onClick={() => openModal(u, "edit")}>
              Edit
            </Button>
          </AdminCan>
          <AdminCan capability="roles.manage">
            <Button size="sm" variant="secondary" onClick={() => openModal(u, "assign-role")}>
              Role
            </Button>
          </AdminCan>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Users</h1>

      <FilterBar>
        <FilterSelect
          label="Role"
          value={filterRole}
          onChange={(v) => { setFilterRole(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All roles" },
            { value: "donor", label: "Donor" },
            { value: "recipient", label: "Recipient" },
            { value: "both", label: "Both" },
          ]}
        />
        <FilterSelect
          label="Verified"
          value={filterVerified}
          onChange={(v) => { setFilterVerified(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "Any" },
            { value: "true", label: "Verified" },
            { value: "false", label: "Unverified" },
          ]}
        />
        <FilterSelect
          label="Status"
          value={filterActive}
          onChange={(v) => { setFilterActive(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "Any" },
            { value: "true", label: "Active" },
            { value: "false", label: "Suspended" },
          ]}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username or email…"
          className="rounded-lg border border-paper-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={visibleRows}
        isLoading={isLoading}
        nextCursorUrl={data?.nextCursorUrl}
        previousCursorUrl={data?.previousCursorUrl}
        onNext={() => setCursorUrl(data!.nextCursorUrl)}
        onPrev={() => setCursorUrl(data!.previousCursorUrl)}
        onRowClick={(u) => openModal(u, "detail")}
        emptyMessage="No users found."
      />

      {/* Detail modal */}
      {selected && modal === "detail" && (
        <Modal open onClose={() => setModal(null)} title={selected.username}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-xs text-ink-700/50">Email</dt><dd>{selected.email}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Role</dt><dd className="capitalize">{selected.role}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Phone</dt><dd>{selected.phone ?? "—"}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Verified</dt><dd>{selected.isVerified ? "Yes" : "No"}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Active</dt><dd>{selected.isActive ? "Active" : "Suspended"}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Admin role</dt><dd>{selected.adminRole?.name ?? "—"}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Joined</dt><dd>{fmtDate(selected.dateJoined)}</dd></div>
          </dl>
        </Modal>
      )}

      {/* Suspend confirm */}
      <ActionModal
        open={modal === "suspend"}
        onClose={() => setModal(null)}
        onConfirm={() => selected && suspendMutation.mutate(selected.id)}
        title={`Suspend ${selected?.username}?`}
        description="This user will no longer be able to log in."
        confirmLabel="Suspend"
        loading={suspendMutation.isPending}
      />

      {/* Reactivate confirm */}
      <ActionModal
        open={modal === "reactivate"}
        onClose={() => setModal(null)}
        onConfirm={() => selected && reactivateMutation.mutate(selected.id)}
        title={`Reactivate ${selected?.username}?`}
        description="This will restore their ability to log in."
        confirmLabel="Reactivate"
        confirmVariant="primary"
        loading={reactivateMutation.isPending}
      />

      {/* Edit modal */}
      {selected && modal === "edit" && (
        <Modal open onClose={() => setModal(null)} title={`Edit ${selected.username}`}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-lg border border-paper-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              >
                <option value="donor">Donor</option>
                <option value="recipient">Recipient</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <Input
                label="Phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editVerified}
                onChange={(e) => setEditVerified(e.target.checked)}
                className="rounded"
              />
              Mark as verified
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={editMutation.isPending}
                onClick={() =>
                  editMutation.mutate({
                    id: selected.id,
                    patch: { role: editRole, phone: editPhone || undefined, isVerified: editVerified },
                  })
                }
              >
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign role modal */}
      {selected && modal === "assign-role" && (
        <Modal open onClose={() => setModal(null)} title={`Assign admin role — ${selected.username}`}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Admin role</label>
              <select
                value={assignRoleId}
                onChange={(e) => setAssignRoleId(e.target.value)}
                className="w-full rounded-lg border border-paper-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              >
                <option value="">— None (revoke) —</option>
                {(rolesData ?? []).map((r: AdminRole) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={assignRoleMutation.isPending}
                onClick={() =>
                  assignRoleMutation.mutate({
                    userId: selected.id,
                    roleId: assignRoleId || null,
                  })
                }
              >
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
