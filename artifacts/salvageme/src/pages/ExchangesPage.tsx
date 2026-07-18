import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Card, EmptyState, Skeleton } from "@/components/ui";

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function ExchangesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["exchanges"],
    queryFn: () => apiClient.listExchanges(),
  });

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="mb-8 h-9 w-40" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl2" />)}
        </div>
      </div>
    );
  }

  const exchanges = data?.results ?? [];

  return (
    <div className="container-page py-10">
      <h1 className="text-display-md">Exchanges</h1>

      {exchanges.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ArrowLeftRight}
            title="No exchanges yet"
            description="When a book request is accepted, the exchange will appear here so you can coordinate the hand-off."
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {exchanges.map((ex) => (
            <Link key={ex.id} href={`/exchanges/${ex.id}`} className="no-underline">
              <Card className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{ex.listingTitle}</p>
                  <p className="mt-0.5 text-sm text-ink-700/70">
                    with {ex.donor.id === ex.recipient.id ? "yourself" : ex.recipient.username}
                    {ex.scheduledAt && (
                      <> · {new Date(ex.scheduledAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-700/50 sm:mt-0">
                  {statusLabel[ex.status] ?? ex.status}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
