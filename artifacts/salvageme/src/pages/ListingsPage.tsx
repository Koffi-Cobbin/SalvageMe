import { useSearch, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ListingCondition } from "@/types";

export function ListingsPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(search);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? undefined;
  const condition = (searchParams.get("condition") as ListingCondition) || undefined;
  const gradeLevel = searchParams.get("gradeLevel") ?? undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", search],
    queryFn: () => apiClient.listListings({ q: q || undefined, category, condition, gradeLevel }),
  });

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get("q") as string) ?? "";
    const params = new URLSearchParams(search);
    if (q) params.set("q", q);
    else params.delete("q");
    const qs = params.toString();
    setLocation(`/listings${qs ? `?${qs}` : ""}`);
  }

  const listings = data?.results ?? [];

  return (
    <div className="container-page py-10">
      <h1 className="text-display-md">Browse Books</h1>

      <div className="mt-6 flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/50"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by title, keyword…"
              className="w-full rounded-lg border border-paper-300 py-2.5 pl-9 pr-3 text-ink-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <ListingFilters />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl2 border border-paper-300 bg-white p-3">
                <Skeleton className="mb-3 h-44 w-full rounded-lg" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-rose-700">Couldn&apos;t load listings. Please try again.</p>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-ink-700/60">No books found matching your search.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setLocation("/listings")}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-700/60">{listings.length} book{listings.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            {data?.nextCursorUrl && (
              <div className="mt-8 text-center">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setLocation(`/listings?cursorUrl=${encodeURIComponent(data.nextCursorUrl!)}`)
                  }
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
