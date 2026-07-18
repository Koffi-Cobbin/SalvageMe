import { Link } from "wouter";
import { clsx } from "clsx";
import { ConditionBadge, ListingStatusBadge } from "@/components/ui/Badge";
import type { Listing } from "@/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = [...listing.images].sort((a, b) => a.order - b.order)[0];

  return (
    <Link href={`/listings/${listing.id}`} className="no-underline">
      <article
        className={clsx(
          "group rounded-xl2 border border-paper-300 bg-white transition-shadow",
          "[box-shadow:0_2px_10px_rgba(29,26,21,0.06)] hover:[box-shadow:0_6px_20px_rgba(29,26,21,0.10)]",
        )}
      >
        <div className="relative h-44 w-full overflow-hidden rounded-t-xl2 bg-paper-200">
          {image ? (
            <img
              src={image.url}
              alt={listing.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
              📚
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug text-ink-900">{listing.title}</h3>
          <p className="mt-1 text-xs text-ink-700/60">
            {listing.owner.username}
            {listing.gradeLevel ? ` · ${listing.gradeLevel}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <ListingStatusBadge status={listing.status} />
            <ConditionBadge condition={listing.condition} />
          </div>
        </div>
      </article>
    </Link>
  );
}
