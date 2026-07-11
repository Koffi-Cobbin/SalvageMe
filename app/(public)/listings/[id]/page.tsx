import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Flag } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ListingStatusBadge, ConditionBadge, VerifiedBadge, Avatar } from "@/components/ui";
import { RequestListingButton } from "@/components/listings/RequestListingButton";

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
        <div className="relative h-72 w-full overflow-hidden rounded-xl2 bg-paper-200 sm:h-96">
          {listing.images[0] ? (
            <Image
              src={listing.images[0].url}
              alt={listing.images[0].alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-700/50">No photo available</div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <ListingStatusBadge status={listing.status} />
          <ConditionBadge condition={listing.condition} />
        </div>

        <h1 className="mt-3 text-display-md">{listing.title}</h1>

        {listing.location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-700/80">
            <MapPin size={15} aria-hidden="true" />
            {listing.location.city}
          </p>
        )}

        <p className="mt-5 whitespace-pre-line text-ink-800">{listing.description}</p>

        <button className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-700/70 hover:text-rose-700">
          <Flag size={14} aria-hidden="true" />
          Report this listing
        </button>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-xl2 border border-paper-300 bg-white p-5">
          <div className="flex items-center gap-3">
            <Avatar name={listing.owner.displayName} src={listing.owner.avatarUrl} />
            <div>
              <p className="font-semibold text-ink-900">{listing.owner.displayName}</p>
              {listing.owner.verified && <VerifiedBadge />}
            </div>
          </div>
          <div className="mt-5">
            {listing.status === "available" ? (
              <RequestListingButton listingId={listing.id} />
            ) : (
              <p className="rounded-lg bg-paper-100 px-4 py-3 text-sm text-ink-700">
                This item is {listing.status === "pending" ? "pending a request" : "already claimed"}.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
