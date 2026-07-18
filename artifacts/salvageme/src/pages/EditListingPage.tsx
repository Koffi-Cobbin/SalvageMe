import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import { PhotoPicker, type PickedPhoto } from "@/components/listings/PhotoPicker";
import type { ListingCondition } from "@/types";

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { user } = useSessionStore();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiClient.getListing(id!),
    enabled: !!id,
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => apiClient.listCategories() });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("good");
  const [categoryId, setCategoryId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [newPhotos, setNewPhotos] = useState<PickedPhoto[]>([]);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      setCondition(listing.condition);
      setCategoryId(listing.category.id);
      setGradeLevel(listing.gradeLevel ?? "");
    }
  }, [listing]);

  const update = useMutation({
    mutationFn: () =>
      apiClient.updateListing(id!, { title, description, condition, categoryId, gradeLevel: gradeLevel || undefined }),
    onSuccess: () => {
      push("Listing updated.", "success");
      setLocation(`/listings/${id}`);
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't save your changes.", "error"),
  });

  const remove = useMutation({
    mutationFn: () => apiClient.deleteListing(id!),
    onSuccess: () => {
      push("Listing removed.", "info");
      setLocation("/dashboard");
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't remove this listing.", "error"),
  });

  const uploadPhotos = useMutation({
    mutationFn: async () => {
      let failures = 0;
      for (const photo of newPhotos) {
        try {
          await apiClient.uploadListingPhoto(id!, photo.file);
        } catch {
          failures += 1;
        }
      }
      return failures;
    },
    onSuccess: (failures) => {
      newPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setNewPhotos([]);
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      if (failures > 0) {
        push(`${failures} of the selected photos failed to upload — try again for those.`, "error");
      } else {
        push("Photos added.", "success");
      }
    },
    onError: () => push("Couldn't upload those photos. Please try again.", "error"),
  });

  if (isLoading) {
    return (
      <div className="container-page max-w-lg py-10">
        <Skeleton className="mb-6 h-9 w-40" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  if (!listing) return <p className="container-page py-10">Listing not found.</p>;

  if (user && listing.owner.id !== user.id) {
    return <p className="container-page py-10">You don&apos;t have permission to edit this listing.</p>;
  }

  return (
    <div className="container-page max-w-lg py-10">
      <h1 className="text-display-md">Edit listing</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-800">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-paper-300 px-3.5 py-2.5 text-ink-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
            required
          />
        </div>
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories?.map((c) => ({ value: c.id, label: c.name })) ?? []}
        />
        <Select
          label="Condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value as ListingCondition)}
          options={[
            { value: "new", label: "New" },
            { value: "good", label: "Good" },
            { value: "fair", label: "Fair" },
            { value: "worn", label: "Worn" },
          ]}
        />
        <Input label="Grade level (optional)" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />

        <div className="border-t border-paper-300 pt-4">
          <p className="mb-3 text-sm font-medium text-ink-800">Photos</p>

          {listing.images.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {[...listing.images]
                .sort((a, b) => a.order - b.order)
                .map((img, i) => (
                  <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-xl2 border border-paper-300">
                    <img
                      src={img.url}
                      alt={`${listing.title} photo ${i + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
            </div>
          )}

          <PhotoPicker photos={newPhotos} onChange={setNewPhotos} />
          {newPhotos.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              loading={uploadPhotos.isPending}
              onClick={() => uploadPhotos.mutate()}
            >
              Upload {newPhotos.length} photo{newPhotos.length > 1 ? "s" : ""}
            </Button>
          )}
        </div>

        <div className="mt-2 flex justify-between">
          <Button type="button" variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
            Delete listing
          </Button>
          <Button type="submit" loading={update.isPending}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}
