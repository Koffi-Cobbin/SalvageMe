import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/admin/AdminCan";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button, Input } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AdminRole, Capability } from "@/types";

// ── Capabilities grouped by domain ─────────────────────────────────────────

const DOMAIN_ORDER = [
  "dashboard", "stats", "users", "listings", "categories",
  "reports", "exchanges", "requests", "ratings", "dropoff",
  "partner_applications", "auditlog", "roles",
];

function groupCapabilities(caps: Capability[]) {
  const groups: Record<string, Capability[]> = {};
  for (const cap of caps) {
    const domain = cap.code.split(".")[0];
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(cap);
  }
  // Sort by domain order
  const ordered: [string, Capability[]][] = [];
  for (const d of DOMAIN_ORDER) {
    if (groups[d]) ordered.push([d, groups[d]]);
  }
  for (const [d, g] of Object.entries(groups)) {
    if (!DOMAIN_ORDER.includes(d)) ordered.push([d, g]);
  }
  return ordered;
}

function domainLabel(domain: string) {
  return domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Role form ──────────────────────────────────────────────────────────────

interface RoleFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  selectedCaps: Set<string>;
  toggleCap: (code: string) => void;
  allCapabilities: Capability[];
  disabled?: boolean;
}

function RoleForm({ name, setName, description, setDescription, selectedCaps, toggleCap, allCapabilities, disabled }: RoleFormProps) {
  const groups = groupCapabilities(allCapabilities);

  return (
    <div className="space-y-4">
      <div>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Content Moderator" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Brief description of this role's purpose"
          className="w-full rounded-xl border border-paper-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Capabilities</label>
          {disabled && (
            <span className="flex items-center gap-1 text-xs text-ink-700/50">
              <Lock size={12} /> Protected role — capabilities locked
            </span>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-paper-300 bg-white p-3 space-y-4">
          {groups.map(([domain, caps]) => (
            <div key={domain}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                {domainLabel(domain)}
              </p>
              <div className="space-y-1.5">
                {caps.map((cap) => (
                  <label
                    key={cap.code}
                    className={`flex items-start gap-2 rounded-lg p-2 text-sm transition-colors ${
                      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-paper-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCaps.has(cap.code)}
                      onChange={() => !disabled && toggleCap(cap.code)}
                      disabled={disabled}
                      className="mt-0.5 rounded"
                    />
                    <div>
                      <span className="font-mono text-xs text-ink-900">{cap.code}</span>
                      <p className="text-xs text-ink-700/60">{cap.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

type ModalKind = "add" | "edit" | "delete";

export function AdminRolesPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalKind | null>(null);
  const [selected, setSelected] = useState<AdminRole | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCaps, setFormCaps] = useState<Set<string>>(new Set());

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiClient.listAdminRoles(),
  });

  const { data: allCapabilities, isLoading: capsLoading } = useQuery({
    queryKey: ["admin", "capabilities"],
    queryFn: () => apiClient.listCapabilities(),
    enabled: modal === "add" || modal === "edit",
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
  }

  function toggleCap(code: string) {
    setFormCaps((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function openAdd() {
    setFormName("");
    setFormDescription("");
    setFormCaps(new Set());
    setModal("add");
  }

  function openEdit(role: AdminRole) {
    setSelected(role);
    setFormName(role.name);
    setFormDescription(role.description);
    setFormCaps(new Set(role.capabilities));
    setModal("edit");
  }

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createAdminRole({
        name: formName,
        description: formDescription,
        capabilities: Array.from(formCaps),
      }),
    onSuccess: () => { invalidate(); push("Role created.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.updateAdminRole(selected!.id, {
        name: formName,
        description: formDescription,
        capabilities: Array.from(formCaps),
      }),
    onSuccess: () => { invalidate(); push("Role updated.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteAdminRole(id),
    onSuccess: () => { invalidate(); push("Role deleted.", "success"); setModal(null); },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && (err.code === "role_protected" || err.code === "role_in_use")
          ? err.message
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  return (
    <AdminCan
      capability="roles.manage"
      fallback={
        <EmptyState
          icon={Lock}
          title="Permission denied"
          description="You don't have permission to manage roles."
        />
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink-900">Roles &amp; Capabilities</h1>
          <Button size="sm" onClick={openAdd}>
            <Plus size={15} /> Add role
          </Button>
        </div>

        {rolesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(roles ?? []).map((role: AdminRole) => (
              <div key={role.id} className="rounded-xl border border-paper-300 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900">{role.name}</h3>
                      {role.isProtected && (
                        <span className="flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700/60">
                          <Lock size={10} /> Protected
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="mt-0.5 text-sm text-ink-700/70">{role.description}</p>
                    )}
                    <p className="mt-1.5 text-xs text-ink-700/50">
                      {role.capabilities.length} capability{role.capabilities.length !== 1 ? "ies" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(role)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    {!role.isProtected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelected(role); setModal("delete"); }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add modal */}
        <Modal open={modal === "add"} onClose={() => setModal(null)} title="Add role">
          <div className="space-y-4">
            {capsLoading ? (
              <p className="text-center text-sm text-ink-700/50">Loading capabilities…</p>
            ) : (
              <RoleForm
                name={formName}
                setName={setFormName}
                description={formDescription}
                setDescription={setFormDescription}
                selectedCaps={formCaps}
                toggleCap={toggleCap}
                allCapabilities={allCapabilities ?? []}
              />
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!formName.trim() || capsLoading}
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                Create
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit modal */}
        {selected && modal === "edit" && (
          <Modal open onClose={() => setModal(null)} title={`Edit — ${selected.name}`}>
            <div className="space-y-4">
              {capsLoading ? (
                <p className="text-center text-sm text-ink-700/50">Loading capabilities…</p>
              ) : (
                <RoleForm
                  name={formName}
                  setName={setFormName}
                  description={formDescription}
                  setDescription={setFormDescription}
                  selectedCaps={formCaps}
                  toggleCap={toggleCap}
                  allCapabilities={allCapabilities ?? []}
                  disabled={selected.isProtected}
                />
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!formName.trim() || capsLoading}
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  Save
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete confirm */}
        <ActionModal
          open={modal === "delete"}
          onClose={() => setModal(null)}
          onConfirm={() => selected && deleteMutation.mutate(selected.id)}
          title={`Delete role "${selected?.name}"?`}
          description="This cannot be undone. Users with this role will lose their admin access."
          confirmLabel="Delete"
          loading={deleteMutation.isPending}
        />
      </div>
    </AdminCan>
  );
}
