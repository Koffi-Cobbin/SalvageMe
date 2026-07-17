import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ListingStatusBadge, ConditionBadge, VerifiedBadge, Avatar } from "@/components/ui";
import { RequestListingButton } from "@/components/listings/RequestListingButton";
import { ReportButton } from "@/components/listings/ReportButton";
import { ListingGallery } from "@/components/listings/ListingGallery";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const listing = await apiClient.getListing(params.id);
    const image = listing.images[0]?.url;
    const description = listing.description.slice(0, 155);
    return {
      title: listing.title,
      description,
      openGraph: {
        title: listing.title,
        description,
        images: image ? [{ url: image }] : undefined,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: listing.title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: "Listing not found" };
  }
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  let listing;
  try {
    listing = await apiClient.getListing(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
      <div>
        <ListingGallery images={listing.images} title={listing.title} />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <ListingStatusBadge status={listing.status} />
          <ConditionBadge condition={listing.condition} />
          <span className="text-xs text-ink-700/60">{listing.category.name}</span>
          {listing.gradeLevel && <span className="text-xs text-ink-700/60">· {listing.gradeLevel}</span>}
        </div>

        <h1 className="mt-3 text-display-md">{listing.title}</h1>

        {listing.distanceKm != null && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-700/80">
            <MapPin size={15} aria-hidden="true" />
            {listing.distanceKm.toFixed(1)} km away
          </p>
        )}

        <p className="mt-5 whitespace-pre-line text-ink-800">{listing.description}</p>

        <ReportButton targetType="listing" targetId={listing.id} />
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-xl2 border border-paper-300 bg-white p-5">
          <div className="flex items-center gap-3">
            <Avatar name={listing.owner.username} />
            <div>
              <p className="font-semibold text-ink-900">{listing.owner.username}</p>
              {listing.owner.isVerified && <VerifiedBadge />}
            </div>
          </div>
          <div className="mt-5">
            {listing.status === "available" ? (
              <RequestListingButton listingId={listing.id} />
            ) : (
              <p className="rounded-lg bg-paper-100 px-4 py-3 text-sm text-ink-700">
                This item is {listing.status === "pending" ? "pending a request" : "no longer available"}.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
