import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Phone, MapPin } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Card, Select, Input, Skeleton } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function ExchangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { user } = useSessionStore();
  const [scheduledAt, setScheduledAt] = useState("");
  const [dropoffPointId, setDropoffPointId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasRated, setHasRated] = useState(false);

  const exchangeQuery = useQuery({ queryKey: ["exchange", id], queryFn: () => apiClient.getExchange(id!) });
  const dropoffsQuery = useQuery({ queryKey: ["dropoffs"], queryFn: () => apiClient.listDropoffPoints() });

  const schedule = useMutation({
    mutationFn: () =>
      apiClient.scheduleExchange(id!, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        dropoffPointId: dropoffPointId || null,
      }),
    onSuccess: () => {
      push("Exchange scheduled.", "success");
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't schedule the exchange.", "error"),
  });

  const complete = useMutation({
    mutationFn: () => apiClient.completeExchange(id!),
    onSuccess: () => {
      push("Marked as complete — thanks for closing the loop!", "success");
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "invalid_transition") {
        push("This exchange isn't in a state that can be completed right now.", "info");
      } else {
        push(err instanceof ApiClientError ? err.message : "Couldn't mark this complete.", "error");
      }
    },
  });

  const cancel = useMutation({
    mutationFn: () => apiClient.cancelExchange(id!),
    onSuccess: () => {
      push("Exchange cancelled — the listing is available again.", "info");
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't cancel this exchange.", "error"),
  });

  const rate = useMutation({
    mutationFn: () => apiClient.rateExchange(id!, { score: rating, comment: comment || undefined }),
    onSuccess: () => {
      push("Thanks for the feedback!", "success");
      setHasRated(true);
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "duplicate_rating") {
        push("You already rated this exchange.", "info");
        setHasRated(true);
        return;
      }
      push(err instanceof ApiClientError ? err.message : "Couldn't submit your rating.", "error");
    },
  });

  if (exchangeQuery.isLoading) {
    return (
      <div className="container-page max-w-xl py-10">
        <Skeleton className="mb-2 h-8 w-2/3" />
        <Skeleton className="mb-6 h-3 w-1/3" />
        <Skeleton className="h-40 w-full rounded-xl2" />
      </div>
    );
  }
  const exchange = exchangeQuery.data;
  if (!exchange) return <p className="container-page py-10">Exchange not found.</p>;

  const counterpart = exchange.donor.id === user?.id ? exchange.recipient : exchange.donor;

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-display-md">{exchange.listingTitle}</h1>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink-700/50">
        {statusLabel[exchange.status] ?? exchange.status} · with {counterpart.username}
      </p>

      {exchange.counterpartContact && (
        <Card className="mt-4 flex flex-col gap-1.5 p-4 text-sm">
          <p className="font-semibold text-ink-900">Coordinate the hand-off</p>
          {exchange.counterpartContact.phone && (
            <p className="flex items-center gap-1.5 text-ink-700">
              <Phone size={14} aria-hidden="true" /> {exchange.counterpartContact.phone}
            </p>
          )}
          {exchange.counterpartContact.latitude != null && (
            <p className="flex items-center gap-1.5 text-ink-700">
              <MapPin size={14} aria-hidden="true" /> Location shared once you&apos;re both party to this exchange
            </p>
          )}
        </Card>
      )}

      {exchange.status === "scheduled" && !exchange.scheduledAt && (
        <Card className="mt-6 flex flex-col gap-4 p-5">
          <h2 className="font-semibold">Schedule the hand-off</h2>
          <Input
            label="Date & time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
          <Select
            label="Drop-off point (optional)"
            options={[
              { value: "", label: "Arrange directly instead" },
              ...(dropoffsQuery.data?.map((d) => ({ value: d.id, label: `${d.name} — ${d.address}` })) ?? []),
            ]}
            value={dropoffPointId}
            onChange={(e) => setDropoffPointId(e.target.value)}
          />
          <Button loading={schedule.isPending} disabled={!scheduledAt} onClick={() => schedule.mutate()}>
            Confirm schedule
          </Button>
        </Card>
      )}

      {exchange.status === "scheduled" && exchange.scheduledAt && (
        <Card className="mt-6 flex flex-col gap-4 p-5">
          <p className="text-sm text-ink-800">
            Meeting {new Date(exchange.scheduledAt).toLocaleString()}
            {exchange.dropoffPoint && (
              <> at <strong>{exchange.dropoffPoint.name}</strong></>
            )}.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" loading={cancel.isPending} onClick={() => cancel.mutate()}>
              Cancel
            </Button>
            <Button loading={complete.isPending} onClick={() => complete.mutate()}>
              Mark exchange complete
            </Button>
          </div>
        </Card>
      )}

      {exchange.status === "completed" && !hasRated && (
        <Card className="mt-6 flex flex-col gap-4 p-5">
          <h2 className="font-semibold">Rate this exchange</h2>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
              >
                <Star size={26} className={n <= rating ? "fill-amber-500 text-amber-500" : "text-paper-300"} />
              </button>
            ))}
          </div>
          <Input label="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button loading={rate.isPending} onClick={() => rate.mutate()}>
            Submit rating
          </Button>
        </Card>
      )}
    </div>
  );
}
