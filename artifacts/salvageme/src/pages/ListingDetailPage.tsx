import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ConditionBadge, ListingStatusBadge, VerifiedBadge, Avatar, Card, Skeleton } from "@/components/ui";
import { ListingGallery } from "@/components/listings/ListingGallery";
import { RequestListingButton } from "@/components/listings/RequestListingButton";
import { ReportButton } from "@/components/listings/ReportButton";
import { useSessionStore } from "@/lib/stores/session-store";

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSessionStore();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiClient.getListing(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container-page max-w-3xl py-10">
        <Skeleton className="mb-6 h-5 w-28" />
        <Skeleton className="mb-4 h-80 w-full rounded-xl2" />
        <Skeleton className="mb-3 h-9 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-lg text-ink-700/60">Listing not found.</p>
        <Link href="/listings" className="mt-4 inline-block text-terracotta-600 hover:underline">
          Back to all books
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.owner.id;

  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/listings" className="mb-6 flex items-center gap-1 text-sm text-ink-700/60 hover:text-terracotta-600 no-underline">
        <ChevronLeft size={16} /> All books
      </Link>

      <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <ListingGallery images={listing.images} title={listing.title} />

          <div className="mt-6">
            <h1 className="text-display-md">{listing.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <ListingStatusBadge status={listing.status} />
              <ConditionBadge condition={listing.condition} />
            </div>
            {listing.gradeLevel && (
              <p className="mt-2 text-sm text-ink-700/70">Grade level: {listing.gradeLevel}</p>
            )}
            <p className="mt-2 text-sm text-ink-700/70">Category: {listing.category.name}</p>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 font-semibold text-ink-900">About this book</h2>
            <p className="text-ink-700/90 leading-relaxed">{listing.description}</p>
          </div>

          <div className="mt-8">
            <RequestListingButton listing={listing} />
            {isOwner && (
              <div className="mt-3">
                <Link href={`/listings/${listing.id}/edit`}>
                  <span className="text-sm text-ink-700/60 hover:text-terracotta-600">Edit listing</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <Card className="h-fit min-w-52 p-4 sm:sticky sm:top-24">
          <div className="flex items-center gap-3">
            <Avatar name={listing.owner.username} size={40} />
            <div>
              <p className="font-semibold text-ink-900">{listing.owner.username}</p>
              {listing.owner.isVerified && <VerifiedBadge />}
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-700/60">
            Member since {new Date(listing.owner.dateJoined).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
          </p>
        </Card>
      </div>

      <div className="mt-10 flex justify-end">
        <ReportButton targetType="listing" targetId={listing.id} />
      </div>
    </div>
  );
}
