import { Skeleton } from "@/components/ui";

export default function AuthLoading() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm">
        <Skeleton className="mx-auto mb-6 h-7 w-40" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="mt-2 h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
