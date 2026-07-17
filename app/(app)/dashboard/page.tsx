"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Inbox, BookMarked } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Card, EmptyState, ListingCardSkeleton, Skeleton } from "@/components/ui";
import { ListingCard } from "@/components/listings/ListingCard";

export default function DashboardPage() {
  const { user } = useSessionStore();

  const listingsQuery = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => apiClient.listListings({}),
  });
  const requestsQuery = useQuery({
    queryKey: ["requests"],
    queryFn: () => apiClient.listRequests(),
  });

  const myListings = listingsQuery.data?.results.filter((l) => l.owner.id === user?.id) ?? [];
  // The API only returns requests where the current user is either the
  // requester or the listing owner; since a request doesn't carry the
  // owner's id directly, "incoming" is everything where someone *else* did
  // the requesting (per API_REFERENCE.md's client-side filtering note).
  const incoming = requestsQuery.data?.results.filter((r) => r.requester.id !== user?.id && r.status === "pending") ?? [];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md">Welcome back{user ? `, ${user.username}` : ""}</h1>
        <Link href="/listings/new">
          <Button>
            <PlusCircle size={18} className="mr-1.5" aria-hidden="true" />
            New listing
          </Button>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-display-sm">Your listings</h2>
        {listingsQuery.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : myListings.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={BookMarked}
              title="No listings yet"
              description="Post your first book to start helping a student or family nearby."
              actionLabel="Create a listing"
              onAction={() => (window.location.href = "/listings/new")}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-display-sm">Pending requests</h2>
        {requestsQuery.isLoading ? (
          <div className="mt-4 flex flex-col gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl2" />)}
          </div>
        ) : incoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Inbox}
              title="No incoming requests"
              description="When someone requests one of your books, it'll show up here."
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {incoming.map((r) => (
              <Card key={r.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-ink-900">{r.listingTitle}</p>
                  <p className="text-sm text-ink-700/70">from {r.requester.username}</p>
                </div>
                <Link href="/requests" className="text-sm font-medium text-terracotta-600">
                  Review
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
