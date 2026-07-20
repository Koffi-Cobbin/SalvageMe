import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { AdminCan } from "@/components/admin/AdminCan";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterBar, FilterSelect } from "@/components/admin/FilterBar";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { ListingStatusBadge, ConditionBadge } from "@/components/ui/Badge";
import type { Listing, Category } from "@/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type ModalKind = "detail" | "remove" | "restore";

export function AdminListingsPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  const [selected, setSelected] = useState<Listing | null>(null);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "listings", { filterStatus, filterCondition, filterCategory, cursorUrl }],
    queryFn: () =>
      apiClient.adminListListings({
        status: filterStatus || undefined,
        condition: (filterCondition as any) || undefined,
        category: filterCategory || undefined,
        cursorUrl,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.listCategories(),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
  }

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminRemoveListing(id),
    onSuccess: () => { invalidate(); push("Listing removed.", "success"); setModal(null); },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminRestoreListing(id),
    onSuccess: () => { invalidate(); push("Listing restored.", "success"); setModal(null); },
    onError: (err) => {
      const msg = err instanceof ApiClientError && err.code === "invalid_transition"
        ? "Can only restore removed listings — this one is pending or claimed."
        : err instanceof ApiClientError ? err.message : "Failed.";
      push(msg, "error");
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: ({ listingId, photoId }: { listingId: string; photoId: string }) =>
      apiClient.adminDeleteListingPhoto(listingId, photoId),
    onSuccess: () => { invalidate(); push("Photo deleted.", "success"); setDeletingPhotoId(null); },
    onError: (err) => {
      const msg = err instanceof ApiClientError && err.status === 502
        ? "Storage service unavailable — safe to retry."
        : err instanceof ApiClientError ? err.message : "Failed.";
      push(msg, "error");
      setDeletingPhotoId(null);
    },
  });

  const columns: Column<Listing>[] = [
    { key: "title", header: "Title", render: (l) => <span className="font-medium">{l.title}</span> },
    {
      key: "owner",
      header: "Owner",
      render: (l) => <span className="text-ink-700/70">{l.owner.username}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (l) => l.category.name,
    },
    {
      key: "condition",
      header: "Condition",
      render: (l) => <ConditionBadge condition={l.condition} />,
    },
    {
      key: "status",
      header: "Status",
      render: (l) => <ListingStatusBadge status={l.status} />,
    },
    {
      key: "created",
      header: "Created",
      render: (l) => <span className="whitespace-nowrap text-xs text-ink-700/60">{fmtDate(l.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (l) => (
        <AdminCan capability="listings.remove_restore">
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {l.status === "available" && (
              <Button size="sm" variant="danger" onClick={() => { setSelected(l); setModal("remove"); }}>
                Remove
              </Button>
            )}
            {l.status === "removed" && (
              <Button size="sm" variant="secondary" onClick={() => { setSelected(l); setModal("restore"); }}>
                Restore
              </Button>
            )}
          </div>
        </AdminCan>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Listings</h1>

      <FilterBar>
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All statuses" },
            { value: "available", label: "Available" },
            { value: "pending", label: "Pending" },
            { value: "claimed", label: "Claimed" },
            { value: "removed", label: "Removed" },
          ]}
        />
        <FilterSelect
          label="Condition"
          value={filterCondition}
          onChange={(v) => { setFilterCondition(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All conditions" },
            { value: "new", label: "New" },
            { value: "good", label: "Good" },
            { value: "fair", label: "Fair" },
            { value: "worn", label: "Worn" },
          ]}
        />
        <FilterSelect
          label="Category"
          value={filterCategory}
          onChange={(v) => { setFilterCategory(v); setCursorUrl(null); }}
          options={[
            { value: "", label: "All categories" },
            ...(categories ?? []).map((c: Category) => ({ value: c.slug, label: c.name })),
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
        onRowClick={(l) => { setSelected(l); setModal("detail"); }}
        emptyMessage="No listings found."
      />

      {/* Detail modal */}
      {selected && modal === "detail" && (
        <Modal open onClose={() => setModal(null)} title={selected.title}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
            <div><dt className="text-xs text-ink-700/50">Owner</dt><dd>{selected.owner.username}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Status</dt><dd><ListingStatusBadge status={selected.status} /></dd></div>
            <div><dt className="text-xs text-ink-700/50">Category</dt><dd>{selected.category.name}</dd></div>
            <div><dt className="text-xs text-ink-700/50">Condition</dt><dd><ConditionBadge condition={selected.condition} /></dd></div>
            <div className="col-span-2"><dt className="text-xs text-ink-700/50">Description</dt><dd className="mt-0.5 text-ink-800">{selected.description}</dd></div>
          </dl>
          {selected.images.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-700/50">Photos</p>
              <div className="flex flex-wrap gap-2">
                {selected.images.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.url}
                      alt={`Photo ${img.order + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border border-paper-300"
                    />
                    <AdminCan capability="listings.delete_photo">
                      <button
                        onClick={() => {
                          setDeletingPhotoId(img.id);
                          deletePhotoMutation.mutate({ listingId: selected.id, photoId: img.id });
                        }}
                        disabled={deletingPhotoId === img.id}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                        aria-label="Delete photo"
                      >
                        <Trash2 size={10} />
                      </button>
                    </AdminCan>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Remove confirm */}
      <ActionModal
        open={modal === "remove"}
        onClose={() => setModal(null)}
        onConfirm={() => selected && removeMutation.mutate(selected.id)}
        title={`Remove listing?`}
        description={`"${selected?.title}" will be hidden from public listings.`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
      />

      {/* Restore confirm */}
      <ActionModal
        open={modal === "restore"}
        onClose={() => setModal(null)}
        onConfirm={() => selected && restoreMutation.mutate(selected.id)}
        title={`Restore listing?`}
        description={`"${selected?.title}" will become available again.`}
        confirmLabel="Restore"
        confirmVariant="primary"
        loading={restoreMutation.isPending}
      />
    </div>
  );
}
