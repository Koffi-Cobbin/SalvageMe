"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Input, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { ListingCondition } from "@/types";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
