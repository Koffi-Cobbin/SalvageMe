"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Input, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import { PhotoPicker, type PickedPhoto } from "@/components/listings/PhotoPicker";

const schema = z.object({
  title: z.string().min(3, "Give it a short, clear title"),
  description: z.string().min(20, "A few sentences helps recipients know what they're getting"),
  categoryId: z.string().min(1, "Choose a category"),
  condition: z.enum(["new", "good", "fair", "worn"]),
  gradeLevel: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type LocationMode = "none" | "current" | "manual";

const DRAFT_KEY = "salvageme_listing_draft";
const STEPS = ["Details", "Photos", "Location"] as const;

export default function NewListingPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Location isn't available in this browser — try entering coordinates manually.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationMode("current");
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location — you can enter coordinates manually instead.");
        setLocating(false);
      },
    );
  }

  const manualLatNum = Number(manualLat);
  const manualLngNum = Number(manualLng);
  const manualCoordsValid =
    manualLat !== "" &&
    manualLng !== "" &&
    !Number.isNaN(manualLatNum) &&
    !Number.isNaN(manualLngNum) &&
    manualLatNum >= -90 &&
    manualLatNum <= 90 &&
    manualLngNum >= -180 &&
    manualLngNum <= 180;

  const resolvedCoords =
    locationMode === "current" ? coords : locationMode === "manual" && manualCoordsValid ? { lat: manualLatNum, lng: manualLngNum } : null;

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const listing = await apiClient.createListing({
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        condition: values.condition,
        gradeLevel: values.gradeLevel || undefined,
        latitude: resolvedCoords?.lat,
        longitude: resolvedCoords?.lng,
      });
      if (photos.length > 0) {
        let failures = 0;
        for (const photo of photos) {
          try {
            await apiClient.uploadListingPhoto(listing.id, photo.file);
          } catch {
            failures += 1;
          }
        }
        if (failures > 0) {
          push(
            `Listing published, but ${failures} of ${photos.length} photo${photos.length > 1 ? "s" : ""} failed to upload — you can add more from Edit listing.`,
            "info",
          );
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
            <p className="text-sm font-medium text-ink-800">Add photos (optional)</p>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <div className="mt-2 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
              <Button type="button" onClick={() => setStep(2)}>Next: Location</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-ink-700/80">
              Sharing a location helps nearby recipients find this listing in distance-sorted
              search. It&apos;s never shown publicly — only as an approximate distance.
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={locationMode === "current" ? "primary" : "secondary"}
                  loading={locating}
                  onClick={requestCurrentLocation}
                  size="sm"
                >
                  {locationMode === "current" && coords ? "Current location ✓" : "Use my current location"}
                </Button>
                <Button
                  type="button"
                  variant={locationMode === "manual" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setLocationMode("manual")}
                >
                  Enter a different location
                </Button>
              </div>

              {locationError && (
                <p role="alert" className="text-xs font-medium text-rose-700">{locationError}</p>
              )}

              {locationMode === "manual" && (
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <Input
                    label="Latitude"
                    inputMode="decimal"
                    placeholder="e.g. 5.6037"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    error={manualLat !== "" && !manualCoordsValid ? "Enter a value between -90 and 90" : undefined}
                  />
                  <Input
                    label="Longitude"
                    inputMode="decimal"
                    placeholder="e.g. -0.1870"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    error={manualLng !== "" && !manualCoordsValid ? "Enter a value between -180 and 180" : undefined}
                  />
                </div>
              )}
            </div>

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
