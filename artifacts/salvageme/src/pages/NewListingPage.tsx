import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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

export function NewListingPage() {
  const [, setLocation] = useLocation();
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
    locationMode === "current"
      ? coords
      : locationMode === "manual" && manualCoordsValid
      ? { lat: manualLatNum, lng: manualLngNum }
      : null;

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
      let failures = 0;
      for (const photo of photos) {
        try {
          await apiClient.uploadListingPhoto(listing.id, photo.file);
        } catch {
          failures++;
        }
      }
      sessionStorage.removeItem(DRAFT_KEY);
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      if (failures > 0) push(`${failures} photo${failures > 1 ? "s" : ""} failed to upload — you can add them from the edit page.`, "error");
      return listing;
    },
    onSuccess: (listing) => {
      push("Listing posted!", "success");
      setLocation(`/listings/${listing.id}`);
    },
    onError: (err) =>
      push(err instanceof ApiClientError ? err.message : "Couldn't post your listing. Please try again.", "error"),
  });

  const categoryOptions = [
    { value: "", label: "Choose a category…" },
    ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];

  return (
    <div className="container-page max-w-lg py-10">
      <h1 className="text-display-md">New listing</h1>

      {/* Step indicator */}
      <ol className="mt-4 mb-8 flex gap-1" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-full h-1.5 transition-colors ${i <= step ? "bg-terracotta-500" : "bg-paper-300"}`}
            aria-current={i === step ? "step" : undefined}
          />
        ))}
      </ol>
      <p className="mb-6 text-sm font-medium text-ink-700/70">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <form
        onSubmit={handleSubmit((v) => {
          if (step < 2) { setStep(step + 1); return; }
          mutation.mutate(v);
        })}
        className="flex flex-col gap-4"
      >
        {step === 0 && (
          <>
            <Input
              label="Title"
              placeholder="e.g. Complete JHS Integrated Science set"
              error={errors.title?.message}
              {...register("title")}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-800">Description</label>
              <textarea
                rows={4}
                placeholder="Condition details, editions, any marks or missing pages…"
                className="rounded-lg border border-paper-300 px-3.5 py-2.5 text-ink-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs font-medium text-rose-700">{errors.description.message}</p>
              )}
            </div>
            <Select
              label="Category"
              options={categoryOptions}
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
            <Input
              label="Grade level (optional)"
              placeholder="e.g. 7th-9th grade, Elementary, SHS"
              {...register("gradeLevel")}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit">Next: Photos</Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <p className="mb-3 text-sm font-medium text-ink-800">Add photos (optional, up to 5)</p>
              <PhotoPicker photos={photos} onChange={setPhotos} />
            </div>
            <div className="mt-2 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
              <Button type="submit">Next: Location</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-ink-800">
                Location helps recipients find books near them. You can skip this.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={locationMode === "current" ? "primary" : "secondary"}
                  size="sm"
                  loading={locating}
                  onClick={requestCurrentLocation}
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
