import { Skeleton } from "@/components/ui";

// Covers dashboard / requests / exchanges / settings / listings/new /
// listings/[id]/edit on first navigation into this route group — these
// pages are client components that fetch their own data (and show their
// own inline skeletons/spinners once mounted), so this is specifically for
// the gap between navigating here and that client JS taking over.
export default function AppLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="mb-6 h-9 w-56" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full rounded-xl2" />
        <Skeleton className="h-20 w-full rounded-xl2" />
        <Skeleton className="h-20 w-full rounded-xl2" />
      </div>
    </div>
  );
}
