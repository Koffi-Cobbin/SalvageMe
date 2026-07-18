import type { GalleryItem } from "@/types";

/**
 * Photos of donation drives, drop-off days, and other SalvageMe community
 * activities, shown on the public /gallery page.
 *
 * There's no backend endpoint for this content (API_REFERENCE.md only
 * covers listings/exchanges/stats, not a media library) so — same pattern
 * as the FAQ page — it lives here as editable config rather than hardcoded
 * JSX, so it's at least a one-file edit instead of a component rewrite.
 *
 * To add a real photo:
 *   1. Drop the image file into /public/gallery/ (JPEG/PNG/WebP, ideally
 *      compressed — this site targets slow connections).
 *   2. Add an entry below pointing at it.
 *
 * The three "sample-*.jpg" entries are placeholder illustrations (not real
 * event photos) included so the gallery page isn't empty out of the box —
 * swap or remove them once real photos are available. See the README for
 * the longer-term plan to back this with a real endpoint instead.
 */
export const galleryItems: GalleryItem[] = [
  {
    id: "sample-1",
    src: "/gallery/sample-1.jpg",
    alt: "Placeholder illustration representing a book donation drive",
    caption: "Sample entry — replace with a real photo in lib/content/gallery.ts",
    date: null,
  },
  {
    id: "sample-2",
    src: "/gallery/sample-2.jpg",
    alt: "Placeholder illustration representing a community drop-off day",
    caption: "Sample entry — replace with a real photo in lib/content/gallery.ts",
    date: null,
  },
  {
    id: "sample-3",
    src: "/gallery/sample-3.jpg",
    alt: "Placeholder illustration representing books reaching a classroom",
    caption: "Sample entry — replace with a real photo in lib/content/gallery.ts",
    date: null,
  },
];
