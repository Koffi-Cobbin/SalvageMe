import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Listing } from "@/types";
import { Card, ListingStatusBadge, ConditionBadge } from "@/components/ui";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images[0];
  return (
    <Link href={`/listings/${listing.id}`} className="block focus-visible:outline-none">
      <Card className="overflow-hidden focus-within:ring-2 focus-within:ring-terracotta-500">
        <div className="relative h-40 w-full bg-paper-200">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-700/50">No photo</div>
          )}
          <div className="absolute left-2 top-2">
            <ListingStatusBadge status={listing.status} />
          </div>
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-2 font-semibold text-ink-900">{listing.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConditionBadge condition={listing.condition} />
            {listing.location && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-700/70">
                <MapPin size={12} aria-hidden="true" />
                {listing.location.city}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
