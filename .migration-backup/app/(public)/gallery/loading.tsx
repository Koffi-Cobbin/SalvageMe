import { Skeleton } from "@/components/ui";

export default function GalleryLoading() {
  return (
    <div className="container-page py-14">
      <Skeleton className="mx-auto mb-3 h-9 w-40" />
      <Skeleton className="mx-auto mb-10 h-4 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl2" />
        ))}
      </div>
    </div>
  );
}
