import { galleryItems } from "@/lib/content/gallery";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export function GalleryPage() {
  return (
    <div className="container-page py-16">
      <h1 className="mb-2 text-display-md">Gallery</h1>
      <p className="mb-10 text-ink-700/70">
        A glimpse into what SalvageMe looks like in practice — books finding new homes across the country.
      </p>
      {galleryItems.length === 0 ? (
        <p className="text-sm text-ink-700/60">Photos coming soon.</p>
      ) : (
        <GalleryGrid items={galleryItems} />
      )}
    </div>
  );
}
