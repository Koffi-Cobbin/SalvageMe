"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { X } from "lucide-react";
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

type LocationMode = "none" | "current" | "manual";

const DRAFT_KEY = "salvageme_listing_draft";
const STEPS = ["Details", "Photos", "Location"] as const;

export default function NewListingPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Revoke the blob preview URL whenever it changes or the page unmounts,
  // so we don't leak memory across a multi-step, possibly-abandoned form.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleImageSelect(file: File) {
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      setImageFile(compressed as File);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(compressed);
      });
    } catch {
      // fall back to the original file if compression fails
      setImageFile(file);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
    } finally {
      setCompressing(false);
    }
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
              ref={fileInputRef}
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

            {previewUrl && (
              <div className="relative mt-1 w-40">
                <div className="relative h-40 w-40 overflow-hidden rounded-xl2 border border-paper-300 bg-paper-100">
                  <Image src={previewUrl} alt="Preview of the photo you selected" fill unoptimized className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove photo"
                  className="absolute -right-2 -top-2 rounded-full bg-ink-900 p-1 text-white shadow-card"
                >
                  <X size={14} />
                </button>
              </div>
            )}

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
