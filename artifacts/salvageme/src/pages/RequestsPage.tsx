import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { BookRequest, Paginated } from "@/types";

export function RequestsPage() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { user } = useSessionStore();
  const { data, isLoading } = useQuery({ queryKey: ["requests"], queryFn: () => apiClient.listRequests() });

  const sent = data?.results.filter((r) => r.requester.id === user?.id) ?? [];
  const incoming = data?.results.filter((r) => r.requester.id !== user?.id) ?? [];

  const accept = useMutation({
    mutationFn: (id: string) => apiClient.acceptRequest(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["requests"] });
      const previous = queryClient.getQueryData<Paginated<BookRequest>>(["requests"]);
      queryClient.setQueryData(["requests"], (old: typeof previous) =>
        old ? { ...old, results: old.results.map((r) => (r.id === id ? { ...r, status: "accepted" as const } : r)) } : old,
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      queryClient.setQueryData(["requests"], context?.previous);
      if (err instanceof ApiClientError && err.code === "invalid_transition") {
        push("This request was already handled.", "info");
      } else {
        push(err instanceof ApiClientError ? err.message : "Couldn't accept the request.", "error");
      }
    },
    onSuccess: () => push("Request accepted — head to Exchanges to schedule the hand-off.", "success"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["requests"] }),
  });

  const decline = useMutation({
    mutationFn: (id: string) => apiClient.declineRequest(id),
    onSuccess: () => {
      push("Request declined.", "info");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "invalid_transition") {
        push("This request was already handled.", "info");
        queryClient.invalidateQueries({ queryKey: ["requests"] });
        return;
      }
      push(err instanceof ApiClientError ? err.message : "Couldn't decline the request.", "error");
    },
  });

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="mb-8 h-9 w-40" />
        <Skeleton className="mb-3 h-7 w-32" />
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl2" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-display-md">Requests</h1>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-display-sm">
          <Inbox size={22} aria-hidden="true" /> Incoming
        </h2>
        {incoming.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Inbox} title="No incoming requests" description="Requests for your listings will appear here." />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {incoming.map((r) => (
              <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-900">{r.listingTitle}</p>
                  {r.message && (
                    <p className="text-sm text-ink-700/80">&ldquo;{r.message}&rdquo; — {r.requester.username}</p>
                  )}
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
        {sent.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Send} title="No sent requests" description="Books you've requested will show up here with their status." />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {sent.map((r) => (
              <Card key={r.id} className="flex items-center justify-between p-4">
                <p className="font-medium text-ink-900">{r.listingTitle}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">{r.status}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
