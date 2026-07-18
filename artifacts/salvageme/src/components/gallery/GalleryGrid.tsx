import type { GalleryItem } from "@/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <figure key={item.id} className="flex flex-col overflow-hidden rounded-xl2 border border-paper-300 bg-white [box-shadow:0_2px_10px_rgba(29,26,21,0.06)]">
          <div className="relative h-56 w-full overflow-hidden bg-paper-200">
            <img
              src={item.src}
              alt={item.alt}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <figcaption className="p-4">
            <p className="text-sm font-medium text-ink-900">{item.caption}</p>
            {item.date && (
              <p className="mt-1 text-xs text-ink-700/60">
                {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
