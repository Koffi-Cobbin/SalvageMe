"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Card, EmptyState } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { ExchangeRequest } from "@/types";

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { data, isLoading } = useQuery({ queryKey: ["requests"], queryFn: () => apiClient.listRequests() });

  const accept = useMutation({
    mutationFn: (id: string) => apiClient.acceptRequest(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["requests"] });
      const previous = queryClient.getQueryData<{ incoming: ExchangeRequest[]; sent: ExchangeRequest[] }>(["requests"]);
      queryClient.setQueryData(["requests"], (old: typeof previous) =>
        old
          ? { ...old, incoming: old.incoming.map((r) => (r.id === id ? { ...r, status: "accepted" as const } : r)) }
          : old,
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      queryClient.setQueryData(["requests"], context?.previous);
      push(err instanceof ApiClientError ? err.message : "Couldn't accept the request.", "error");
    },
    onSuccess: () => push("Request accepted — time to schedule the exchange.", "success"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["requests"] }),
  });

  const decline = useMutation({
    mutationFn: (id: string) => apiClient.declineRequest(id),
    onSuccess: () => {
      push("Request declined.", "info");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't decline the request.", "error"),
  });

  if (isLoading) return <p className="container-page py-10 text-ink-700/70">Loading requests…</p>;

  return (
    <div className="container-page py-10">
      <h1 className="text-display-md">Requests</h1>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-display-sm">
          <Inbox size={22} aria-hidden="true" /> Incoming
        </h2>
        {data!.incoming.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Inbox} title="No incoming requests" description="Requests for your listings will appear here." />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {data!.incoming.map((r) => (
              <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-900">{r.listing.title}</p>
                  <p className="text-sm text-ink-700/80">&ldquo;{r.message}&rdquo; — {r.requester.displayName}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-700/50">{r.status}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" loading={decline.isPending} onClick={() => decline.mutate(r.id)}>
                      Decline
                    </Button>
                    <Button size="sm" loading={accept.isPending} onClick={() => accept.mutate(r.id)}>
                      Accept
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-display-sm">
          <Send size={20} aria-hidden="true" /> Sent
        </h2>
        {data!.sent.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Send} title="No sent requests" description="Books you've requested will show up here with their status." />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {data!.sent.map((r) => (
              <Card key={r.id} className="flex items-center justify-between p-4">
                <p className="font-medium text-ink-900">{r.listing.title}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">{r.status}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
