"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Input, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import { PhotoPicker, type PickedPhoto } from "@/components/listings/PhotoPicker";
import type { ListingCondition } from "@/types";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { user } = useSessionStore();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiClient.getListing(id),
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
      apiClient.updateListing(id, { title, description, condition, categoryId, gradeLevel: gradeLevel || undefined }),
    onSuccess: () => {
      push("Listing updated.", "success");
      router.push(`/listings/${id}`);
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't save your changes.", "error"),
  });

  const remove = useMutation({
    mutationFn: () => apiClient.deleteListing(id),
    onSuccess: () => {
      push("Listing removed.", "info");
      router.push("/dashboard");
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't remove this listing.", "error"),
  });

  const uploadPhotos = useMutation({
    mutationFn: async () => {
      let failures = 0;
      for (const photo of newPhotos) {
        try {
          await apiClient.uploadListingPhoto(id, photo.file);
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

  if (isLoading) return <p className="container-page py-10 text-ink-700/70">Loading…</p>;
  if (!listing) return <p className="container-page py-10">Listing not found.</p>;

  // The API enforces ownership server-side (403 on PATCH/DELETE); this
  // client check only avoids flashing an edit form the user can't save.
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
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
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
                    <Image src={img.url} alt={`${listing.title} photo ${i + 1}`} fill sizes="96px" className="object-cover" />
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
