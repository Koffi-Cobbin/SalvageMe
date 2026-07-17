"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Card, EmptyState, Skeleton } from "@/components/ui";

const statusLabel: Record<string, string> = {
  scheduled: "Scheduling / scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export default function ExchangesPage() {
  const { user } = useSessionStore();
  const { data, isLoading } = useQuery({ queryKey: ["exchanges"], queryFn: () => apiClient.listExchanges() });

  return (
    <div className="container-page py-10">
      <h1 className="text-display-md">Exchanges</h1>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl2" />)}
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Handshake}
            title="No exchanges yet"
            description="Once a request is accepted, the hand-off shows up here to schedule and complete."
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {data.results.map((ex) => {
            const counterpart = ex.donor.id === user?.id ? ex.recipient : ex.donor;
            return (
              <Link key={ex.id} href={`/exchanges/${ex.id}`}>
                <Card className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-ink-900">{ex.listingTitle}</p>
                    <p className="text-sm text-ink-700/70">with {counterpart.username}</p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                    {statusLabel[ex.status] ?? ex.status}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
