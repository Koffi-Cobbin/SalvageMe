import { Skeleton } from "@/components/ui";

export default function ListingDetailLoading() {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
      <div>
        <Skeleton className="h-72 w-full rounded-xl2 sm:h-96" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-5 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
      <div className="rounded-xl2 border border-paper-300 bg-white p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-5 h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
