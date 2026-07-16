import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { EmptyState } from "@/components/ui";
import type { ListingCondition } from "@/types";

export const metadata: Metadata = {
  title: "Browse Books",
  description: "Find free books nearby — filter by category, condition, and grade level.",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { category?: string; condition?: string; gradeLevel?: string; q?: string };
}) {
  const { results } = await apiClient.listListings({
    category: searchParams.category || undefined,
    condition: (searchParams.condition as ListingCondition) || undefined,
    gradeLevel: searchParams.gradeLevel || undefined,
    q: searchParams.q || undefined,
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-display-md">Browse books</h1>
      <p className="mt-2 text-ink-700/90">{results.length} listing{results.length === 1 ? "" : "s"} available</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside aria-label="Filters">
          <ListingFilters />
        </aside>

        <div>
          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No listings match those filters"
              description="Try broadening your search — remove a filter or check back soon as new books are added every day."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
