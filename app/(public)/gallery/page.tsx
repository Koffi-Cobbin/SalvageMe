import type { Metadata } from "next";
import { Images } from "lucide-react";
import { galleryItems } from "@/lib/content/gallery";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from SalvageMe donation drives, drop-off days, and the communities we've reached.",
  openGraph: {
    title: "SalvageMe Gallery",
    description: "Photos from SalvageMe donation drives, drop-off days, and the communities we've reached.",
  },
};

export default function GalleryPage() {
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-display-md">Gallery</h1>
        <p className="mt-3 text-ink-700/90">
          A look at donation drives, drop-off days, and the students and classrooms SalvageMe books
          have reached.
        </p>
      </div>

      <div className="mt-10">
        {galleryItems.length === 0 ? (
          <EmptyState
            icon={Images}
            title="No photos yet"
            description="Check back soon — we'll be sharing photos from our donation drives and community events here."
          />
        ) : (
          <GalleryGrid items={galleryItems} />
        )}
      </div>
    </div>
  );
}
