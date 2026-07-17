"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "@/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl2 bg-paper-200 focus-visible:outline-none"
            aria-label={`View photo: ${item.caption}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox items={items} index={openIndex} onClose={() => setOpenIndex(null)} onIndexChange={setOpenIndex} />
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const item = items[index];

  useEffect(() => {
    closeButtonRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink-900/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="flex justify-end">
        <button
          onClick={onClose}
          ref={closeButtonRef}
          tabIndex={-1}
          aria-label="Close photo viewer"
          className="rounded-lg p-2 text-white hover:bg-white/10"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {items.length > 1 && (
          <button
            onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
            aria-label="Previous photo"
            className="absolute left-0 rounded-full p-2 text-white hover:bg-white/10 sm:left-4"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div className="relative h-full max-h-[70vh] w-full max-w-3xl">
          <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" priority />
        </div>

        {items.length > 1 && (
          <button
            onClick={() => onIndexChange((index + 1) % items.length)}
            aria-label="Next photo"
            className="absolute right-0 rounded-full p-2 text-white hover:bg-white/10 sm:right-4"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      <div className="mx-auto max-w-lg pb-2 pt-4 text-center">
        <p className="text-sm text-white/90">{item.caption}</p>
        {item.date && (
          <p className="mt-1 text-xs text-white/60">
            {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
        {items.length > 1 && (
          <p className="mt-1 text-xs text-white/50">
            {index + 1} / {items.length}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
