"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";
import imageCompression from "browser-image-compression";

export interface PickedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 6;

export function PhotoPicker({
  photos,
  onChange,
  max = MAX_PHOTOS,
}: {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
  max?: number;
}) {
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke every preview URL on unmount so a multi-step, possibly-abandoned
  // form doesn't leak blob memory.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFilesSelected(fileList: FileList) {
    const room = max - photos.length;
    if (room <= 0) return;
    const files = Array.from(fileList).slice(0, room);

    setCompressing(true);
    try {
      const compressed = await Promise.all(
        files.map(async (file) => {
          try {
            return (await imageCompression(file, {
              maxSizeMB: 0.6,
              maxWidthOrHeight: 1600,
              useWebWorker: true,
            })) as File;
          } catch {
            return file; // fall back to the original if compression fails
          }
        }),
      );
      const newPhotos: PickedPhoto[] = compressed.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      onChange([...photos, ...newPhotos]);
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(id: string) {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  }

  const atMax = photos.length >= max;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative h-28 w-28">
            <div className="relative h-28 w-28 overflow-hidden rounded-xl2 border border-paper-300 bg-paper-100">
              <Image
                src={photo.previewUrl}
                alt={`Selected photo ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute -right-2 -top-2 rounded-full bg-ink-900 p-1 text-white shadow-card"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {!atMax && (
          <label
            htmlFor="photo-picker-input"
            className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl2 border-2 border-dashed border-paper-300 text-ink-700/60 hover:border-terracotta-500 hover:text-terracotta-600"
          >
            <Plus size={22} aria-hidden="true" />
            <span className="text-xs font-medium">Add photo</span>
          </label>
        )}
      </div>

      <input
        ref={fileInputRef}
        id="photo-picker-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        aria-describedby="photo-picker-hint"
        onChange={(e) => e.target.files && e.target.files.length > 0 && handleFilesSelected(e.target.files)}
        disabled={atMax}
      />
      <p id="photo-picker-hint" className="text-xs text-ink-700/70">
        JPEG, PNG, or WebP, up to 8MB each — {photos.length}/{max} added. Photos are compressed
        automatically to keep uploads fast on slow connections.
      </p>
      {compressing && <p className="text-xs text-ink-700/70">Compressing photo{photos.length > 1 ? "s" : ""}…</p>}
    </div>
  );
}
