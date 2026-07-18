import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen, ArrowLeftRight, Inbox } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Card, Avatar, Skeleton, ListingStatusBadge } from "@/components/ui";

export function DashboardPage() {
  const { user } = useSessionStore();

  const { data: myListings, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: () => apiClient.listListings({}),
    select: (data) => data.results.filter((l) => l.owner.id === user?.id),
    enabled: !!user,
  });

  const { data: exchanges, isLoading: exchangesLoading } = useQuery({
    queryKey: ["exchanges"],
    queryFn: () => apiClient.listExchanges(),
    select: (data) => data.results.slice(0, 3),
  });

  const { data: requests } = useQuery({
    queryKey: ["requests"],
    queryFn: () => apiClient.listRequests(),
    select: (data) => data.results.filter((r) => r.requester.id !== user?.id && r.status === "pending").length,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={user.username} src={user.avatarUrl} size={52} />
          <div>
            <h1 className="text-display-sm">{user.username}</h1>
            <p className="text-sm text-ink-700/60 capitalize">{user.role}</p>
          </div>
        </div>
        <Link href="/listings/new">
          <Button>
            <Plus size={18} /> New listing
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="flex items-center gap-4 p-5">
          <BookOpen size={22} className="text-terracotta-500" />
          <div>
            <p className="text-2xl font-bold text-ink-900">{myListings?.length ?? "—"}</p>
            <p className="text-xs text-ink-700/60">My listings</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <ArrowLeftRight size={22} className="text-terracotta-500" />
          <div>
            <p className="text-2xl font-bold text-ink-900">{exchanges?.length ?? "—"}</p>
            <p className="text-xs text-ink-700/60">Recent exchanges</p>
          </div>
        </Card>
        <Link href="/requests" className="no-underline">
          <Card className="flex cursor-pointer items-center gap-4 p-5 hover:[box-shadow:0_6px_20px_rgba(29,26,21,0.10)]">
            <Inbox size={22} className="text-terracotta-500" />
            <div>
              <p className="text-2xl font-bold text-ink-900">{requests ?? "—"}</p>
              <p className="text-xs text-ink-700/60">Pending requests</p>
            </div>
          </Card>
        </Link>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display-sm">My listings</h2>
          <Link href="/listings/new" className="text-sm text-terracotta-600 hover:underline no-underline">
            + Add new
          </Link>
        </div>
        {listingsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl2" />)}
          </div>
        ) : !myListings?.length ? (
          <p className="text-sm text-ink-700/60">You haven&apos;t listed any books yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {myListings.map((l) => (
              <Card key={l.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-ink-900">{l.title}</p>
                  <p className="mt-0.5 text-xs text-ink-700/60">{l.category.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ListingStatusBadge status={l.status} />
                  <Link href={`/listings/${l.id}/edit`} className="text-xs text-ink-700/60 hover:text-terracotta-600 no-underline">
                    Edit
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display-sm">Recent exchanges</h2>
          <Link href="/exchanges" className="text-sm text-terracotta-600 hover:underline no-underline">
            See all
          </Link>
        </div>
        {exchangesLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl2" />)}
          </div>
        ) : !exchanges?.length ? (
          <p className="text-sm text-ink-700/60">No exchanges yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {exchanges.map((ex) => (
              <Link key={ex.id} href={`/exchanges/${ex.id}`} className="no-underline">
                <Card className="flex items-center justify-between p-4">
                  <p className="font-medium text-ink-900">{ex.listingTitle}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                    {ex.status}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
