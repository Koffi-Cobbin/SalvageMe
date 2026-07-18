import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import compressImage from "browser-image-compression";

export interface PickedPhoto {
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 5;
const COMPRESSION_OPTIONS = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true };

export function PhotoPicker({
  photos,
  onChange,
}: {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) return;
      const toProcess = Array.from(files).slice(0, remaining);
      const newPhotos: PickedPhoto[] = await Promise.all(
        toProcess.map(async (file) => {
          const compressed = await compressImage(file, COMPRESSION_OPTIONS).catch(() => file);
          return { file: compressed, previewUrl: URL.createObjectURL(compressed) };
        }),
      );
      onChange([...photos, ...newPhotos]);
    },
    [photos, onChange],
  );

  function remove(idx: number) {
    URL.revokeObjectURL(photos[idx].previewUrl);
    onChange(photos.filter((_, i) => i !== idx));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {photos.length < MAX_PHOTOS && (
        <button
          type="button"
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-paper-300 py-8 text-sm text-ink-700/60 hover:border-terracotta-300 hover:text-terracotta-600"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          aria-label="Upload photos"
        >
          <Upload size={22} />
          <span>
            Drag &amp; drop or click to select
            <br />
            <span className="text-xs">{MAX_PHOTOS - photos.length} photo{MAX_PHOTOS - photos.length !== 1 ? "s" : ""} remaining</span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.previewUrl} className="group relative h-20 w-20 overflow-hidden rounded-lg">
              <img src={p.previewUrl} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => remove(i)}
                aria-label={`Remove photo ${i + 1}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
