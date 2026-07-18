"use client";

import { useState } from "react";
import Image from "next/image";
import type { ListingImage } from "@/types";

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const active = sorted.find((img) => img.id === activeId) ?? sorted[0];

  if (!active) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-xl2 bg-paper-200 text-ink-700/50 sm:h-96">
        No photo available
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden rounded-xl2 bg-paper-200 sm:h-96">
        <Image
          key={active.id}
          src={active.url}
          alt={sorted.length > 1 ? `${title} — photo ${sorted.findIndex((i) => i.id === active.id) + 1} of ${sorted.length}` : title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
      </div>

      {sorted.length > 1 && (
        <div role="tablist" aria-label={`${title} photos`} className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={img.id === active.id}
              aria-label={`View photo ${i + 1} of ${sorted.length}`}
              onClick={() => setActiveId(img.id)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                img.id === active.id ? "border-terracotta-500" : "border-transparent hover:border-paper-300"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
