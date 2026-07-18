import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListingImage } from "@/types";

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = sorted[activeIdx];

  if (!active) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl2 bg-paper-200 text-6xl">📚</div>
    );
  }

  function prev() {
    setActiveIdx((i) => (i === 0 ? sorted.length - 1 : i - 1));
  }
  function next() {
    setActiveIdx((i) => (i === sorted.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-72 w-full overflow-hidden rounded-xl2 bg-paper-200 sm:h-96">
        <img
          key={active.id}
          src={active.url}
          alt={`${title} — photo ${activeIdx + 1} of ${sorted.length}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label="Photo thumbnails">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setActiveIdx(i)}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIdx ? "border-terracotta-500" : "border-transparent"
              }`}
            >
              <img
                src={img.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
