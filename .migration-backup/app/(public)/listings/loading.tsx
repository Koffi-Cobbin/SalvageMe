import { ListingCardSkeleton, Skeleton } from "@/components/ui";

export default function ListingsLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="hidden flex-col gap-4 rounded-xl2 border border-paper-300 bg-white p-4 md:flex">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
