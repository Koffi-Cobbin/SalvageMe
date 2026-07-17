import { Skeleton } from "@/components/ui";

// Route-group-level loading UI: Next.js treats special files placed
// directly inside a route group folder as applying to every route nested
// under it, so this one file covers home / how-it-works / faq / listings
// while data is being fetched on first navigation. More specific
// loading.tsx files further down (e.g. listings/, listings/[id]/) take
// precedence for their own segment.
export default function PublicLoading() {
  return (
    <div className="container-page py-14">
      <Skeleton className="mx-auto mb-4 h-9 w-2/3 max-w-md" />
      <Skeleton className="mx-auto mb-8 h-4 w-1/2 max-w-sm" />
      <div className="mx-auto flex max-w-sm flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
