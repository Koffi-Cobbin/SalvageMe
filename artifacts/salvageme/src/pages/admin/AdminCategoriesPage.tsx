import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/lib/stores/toast-store";
import { ActionModal } from "@/components/admin/ActionModal";
import { Modal } from "@/components/ui/Modal";
import { Button, Input } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Category } from "@/types";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function AdminCategoriesPage() {
  const { push } = useToastStore();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient.adminListCategories(),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.adminCreateCategory({ name, slug: toSlug(name) }),
    onSuccess: () => {
      invalidate();
      push("Category created.", "success");
      setShowAdd(false);
      setNewName("");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && err.code === "duplicate_name"
          ? "A category with that name already exists."
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.adminUpdateCategory(id, { name, slug: toSlug(name) }),
    onSuccess: () => {
      invalidate();
      push("Category updated.", "success");
      setEditId(null);
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Failed.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteCategory(id),
    onSuccess: () => {
      invalidate();
      push("Category deleted.", "success");
      setDeleteTarget(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError && err.code === "category_in_use"
          ? "Remove or recategorise all listings in this category before deleting it."
          : err instanceof ApiClientError
          ? err.message
          : "Failed.";
      push(msg, "error");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Categories</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={15} />
          Add category
        </Button>
      </div>

      <div className="rounded-xl border border-paper-300 bg-white">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (categories ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-700/50">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-paper-200">
            {(categories ?? []).map((cat: Category) => (
              <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
                {editId === cat.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateMutation.mutate({ id: cat.id, name: editName });
                        if (e.key === "Escape") setEditId(null);
                      }}
                      autoFocus
                      className="flex-1 rounded-lg border border-terracotta-400 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                    />
                    <span className="ml-1 text-xs text-ink-700/40">→ {toSlug(editName)}</span>
                    <button
                      onClick={() => updateMutation.mutate({ id: cat.id, name: editName })}
                      disabled={updateMutation.isPending}
                      className="rounded-lg p-1.5 text-moss-600 hover:bg-moss-50 disabled:opacity-50"
                      aria-label="Save"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-lg p-1.5 text-ink-700/50 hover:bg-paper-200"
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-ink-900">{cat.name}</span>
                      <span className="ml-2 font-mono text-xs text-ink-700/40">{cat.slug}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditId(cat.id);
                        setEditName(cat.name);
                      }}
                      className="rounded-lg p-1.5 text-ink-700/50 hover:bg-paper-200 hover:text-ink-900"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="rounded-lg p-1.5 text-ink-700/50 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add category modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setNewName(""); }} title="Add category">
        <div className="space-y-4">
          <div>
            <Input
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Languages"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createMutation.mutate(newName.trim());
              }}
              autoFocus
            />
            {newName && (
              <p className="mt-1 font-mono text-xs text-ink-700/50">
                Slug preview: {toSlug(newName)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setNewName(""); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newName.trim()}
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate(newName.trim())}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ActionModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Listings in this category will need to be recategorised first."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
