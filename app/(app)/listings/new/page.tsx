"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Input, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

const schema = z.object({
  title: z.string().min(3, "Give it a short, clear title"),
  description: z.string().min(20, "A few sentences helps recipients know what they're getting"),
  categoryId: z.string().min(1, "Choose a category"),
  condition: z.enum(["new", "good", "fair", "worn"]),
  gradeLevel: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const DRAFT_KEY = "salvageme_listing_draft";
const STEPS = ["Details", "Photos", "Location"] as const;

export default function NewListingPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => apiClient.listCategories() });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { condition: "good" },
  });

  // Autosave draft to sessionStorage (not localStorage, to avoid stale PII
  // lingering indefinitely) so a multi-step abandonment doesn't lose data.
  const values = watch();
  useEffect(() => {
    const t = setTimeout(() => {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    }, 500);
    return () => clearTimeout(t);
  }, [values]);

  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved) push("Restored your unsaved draft.", "info");
  }, [push]);

  async function handleImageSelect(file: File) {
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      setImageFile(compressed as File);
    } catch {
      setImageFile(file); // fall back to original if compression fails
    } finally {
      setCompressing(false);
    }
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      push("Location isn't available in this browser.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseMyLocation(true);
      },
      () => push("Couldn't get your location — you can still publish without it.", "error"),
    );
  }

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const listing = await apiClient.createListing({
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        condition: values.condition,
        gradeLevel: values.gradeLevel || undefined,
        latitude: useMyLocation && coords ? coords.lat : undefined,
        longitude: useMyLocation && coords ? coords.lng : undefined,
      });
      if (imageFile) {
        try {
          await apiClient.uploadListingPhoto(listing.id, imageFile);
        } catch {
          push("Listing published, but the photo upload failed — you can add one from Edit listing.", "info");
        }
      }
      return listing;
    },
    onSuccess: (listing) => {
      sessionStorage.removeItem(DRAFT_KEY);
      push("Listing published!", "success");
      router.push(`/listings/${listing.id}`);
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't publish your listing.", "error"),
  });

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-display-md">List a book</h1>
      <ol className="mt-4 flex gap-4 text-sm font-medium" aria-label="Form progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-terracotta-600" : "text-ink-700/50"} aria-current={i === step ? "step" : undefined}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="mt-6 flex flex-col gap-4">
        {step === 0 && (
          <>
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <Input label="Description" error={errors.description?.message} {...register("description")} />
            <Select
              label="Category"
              options={[
                { value: "", label: "Choose a category" },
                ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? []),
              ]}
              error={errors.categoryId?.message}
              {...register("categoryId")}
            />
            <Select
              label="Condition"
              options={[
                { value: "new", label: "New" },
                { value: "good", label: "Good" },
                { value: "fair", label: "Fair" },
                { value: "worn", label: "Worn" },
              ]}
              {...register("condition")}
            />
            <Input label="Grade level (optional)" placeholder="e.g. 9th-10th grade" {...register("gradeLevel")} />
            <Button type="button" onClick={() => setStep(1)} className="mt-2">Next: Photos</Button>
          </>
        )}

        {step === 1 && (
          <>
            <label className="text-sm font-medium text-ink-800" htmlFor="photo">
              Add a photo (optional)
            </label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="photo-hint"
              onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
            />
            <p id="photo-hint" className="text-xs text-ink-700/70">
              JPEG, PNG, or WebP, up to 8MB. Photos are compressed automatically to keep uploads
              fast on slow connections.
            </p>
            {compressing && <p className="text-xs text-ink-700/70">Compressing photo…</p>}
            <div className="mt-2 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
              <Button type="button" onClick={() => setStep(2)}>Next: Location</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-ink-700/80">
              Sharing your location helps nearby recipients find this listing in distance-sorted
              search. It&apos;s never shown publicly — only as an approximate distance.
            </p>
            <Button type="button" variant="secondary" onClick={requestLocation} className="self-start">
              {coords ? "Location captured ✓" : "Use my current location"}
            </Button>
            <div className="mt-2 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" loading={mutation.isPending}>Publish listing</Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
