import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Pencil, Trash2, Users } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/admin/AdminCan";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button, Input } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AdminDropoffPoint } from "@/types";

type ModalKind = "add" | "edit" | "delete" | "managers";

interface PointForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: PointForm = { name: "", address: "", latitude: "", longitude: "" };

export function AdminDropoffPointsPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalKind | null>(null);
  const [selected, setSelected] = useState<AdminDropoffPoint | null>(null);
  const [form, setForm] = useState<PointForm>(EMPTY_FORM);
  const [managerInput, setManagerInput] = useState("");

  const { data: points, isLoading } = useQuery({
    queryKey: ["admin", "dropoff-points"],
    queryFn: () => apiClient.adminListDropoffPoints(),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "dropoff-points"] });
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal("add");
  }

  function openEdit(p: AdminDropoffPoint) {
    setSelected(p);
    setForm({ name: p.name, address: p.address, latitude: String(p.latitude), longitude: String(p.longitude) });
    setModal("edit");
  }

  function openManagers(p: AdminDropoffPoint) {
    setSelected(p);
    setManagerInput(p.managers.map((m) => m.username).join(", "));
    setModal("managers");
  }

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.adminCreateDropoffPoint({
        name: form.name,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      }),
    onSuccess: () => { invalidate(); push("Drop-off point created.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.adminUpdateDropoffPoint(selected!.id, {
        name: form.name,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      }),
    onSuccess: () => { invalidate(); push("Drop-off point updated.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteDropoffPoint(id),
    onSuccess: () => { invalidate(); push("Drop-off point deleted.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  // Manager assignment uses user IDs — for the mock we parse username input and map to IDs
  const assignManagersMutation = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: number[] }) =>
      apiClient.adminAssignDropoffManagers(id, userIds),
    onSuccess: () => { invalidate(); push("Managers updated.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  function FormFields() {
    return (
      <div className="space-y-3">
        <div>
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tema Community Library" />
        </div>
        <div>
          <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street, City" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input label="Latitude" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="5.5427" type="number" step="0.0001" />
          </div>
          <div>
            <Input label="Longitude" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="-0.2062" type="number" step="0.0001" />
          </div>
        </div>
      </div>
    );
  }

  const formValid = form.name && form.address && form.latitude && form.longitude;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Drop-off Points</h1>
        <AdminCan capability="dropoff.manage_all">
          <Button size="sm" onClick={openAdd}>
            <Plus size={15} />
            Add drop-off point
          </Button>
        </AdminCan>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (points ?? []).length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-700/50">No drop-off points found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(points ?? []).map((p: AdminDropoffPoint) => (
            <div key={p.id} className="rounded-xl border border-paper-300 bg-white p-5">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="mt-0.5 shrink-0 text-terracotta-500" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink-900">{p.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-700/70">{p.address}</p>
                  <p className="mt-0.5 font-mono text-xs text-ink-700/40">
                    {p.latitude}, {p.longitude}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.managers.length === 0 ? (
                      <span className="text-xs text-ink-700/40">No managers</span>
                    ) : (
                      p.managers.map((m) => (
                        <span key={m.id} className="rounded-full bg-paper-200 px-2 py-0.5 text-xs text-ink-700">
                          {m.username}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                  <Pencil size={13} /> Edit
                </Button>
                <AdminCan capability="dropoff.manage_all">
                  <Button size="sm" variant="secondary" onClick={() => openManagers(p)}>
                    <Users size={13} /> Managers
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelected(p); setModal("delete"); }}>
                    <Trash2 size={13} />
                  </Button>
                </AdminCan>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Add drop-off point">
        <div className="space-y-4">
          <FormFields />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button size="sm" disabled={!formValid} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title={`Edit — ${selected?.name}`}>
        <div className="space-y-4">
          <FormFields />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button size="sm" disabled={!formValid} loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign managers modal */}
      {selected && modal === "managers" && (
        <Modal open onClose={() => setModal(null)} title={`Managers — ${selected.name}`}>
          <div className="space-y-4">
            <p className="text-sm text-ink-700/70">
              Enter user IDs (comma-separated). This replaces the entire manager list.
            </p>
            <div>
              <Input
                label="User IDs"
                value={managerInput}
                onChange={(e) => setManagerInput(e.target.value)}
                placeholder="e.g. 2, 5, 11"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                size="sm"
                loading={assignManagersMutation.isPending}
                onClick={() => {
                  const ids = managerInput
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => !isNaN(n) && n > 0);
                  assignManagersMutation.mutate({ id: selected.id, userIds: ids });
                }}
              >
                Save managers
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
        title={`Delete "${selected?.name}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
