"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Card, Select, Input } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

export default function ExchangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [isFlexible, setIsFlexible] = useState(true);
  const [dropoffPointId, setDropoffPointId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const exchangeQuery = useQuery({ queryKey: ["exchange", id], queryFn: () => apiClient.getExchange(id) });
  const dropoffsQuery = useQuery({ queryKey: ["dropoffs"], queryFn: () => apiClient.listDropoffPoints() });

  const schedule = useMutation({
    mutationFn: () =>
      apiClient.scheduleExchange(id, { scheduledFor: null, isFlexible, dropoffPointId: dropoffPointId || null }),
    onSuccess: () => {
      push("Exchange scheduled.", "success");
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't schedule the exchange.", "error"),
  });

  const complete = useMutation({
    mutationFn: () => apiClient.completeExchange(id),
    onSuccess: () => {
      push("Marked as complete — thanks for closing the loop!", "success");
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't mark this complete.", "error"),
  });

  if (exchangeQuery.isLoading) return <p className="container-page py-10 text-ink-700/70">Loading exchange…</p>;
  const exchange = exchangeQuery.data;
  if (!exchange) return <p className="container-page py-10">Exchange not found.</p>;

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-display-md">{exchange.listing.title}</h1>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink-700/50">{exchange.status}</p>

      {exchange.status === "scheduling" && (
        <Card className="mt-6 flex flex-col gap-4 p-5">
          <h2 className="font-semibold">Schedule the hand-off</h2>
          <Select
            label="Drop-off point"
            options={[
              { value: "", label: "Choose a location" },
              ...(dropoffsQuery.data?.map((d) => ({ value: d.id, label: `${d.name} — ${d.hours}` })) ?? []),
            ]}
            value={dropoffPointId}
            onChange={(e) => setDropoffPointId(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFlexible} onChange={(e) => setIsFlexible(e.target.checked)} />
            I&apos;m flexible on timing
          </label>
          <Button loading={schedule.isPending} onClick={() => schedule.mutate()}>
            Confirm schedule
          </Button>
        </Card>
      )}

      {exchange.status === "scheduled" && (
        <Card className="mt-6 flex flex-col gap-4 p-5">
          <p className="text-sm text-ink-800">
            Meeting at <strong>{exchange.dropoffPoint?.name ?? "a time you arrange directly"}</strong>.
          </p>
          <Button loading={complete.isPending} onClick={() => complete.mutate()}>
            Mark exchange complete
          </Button>
        </Card>
      )}

      {exchange.status === "completed" && !exchange.rating && (
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
          <Button
            onClick={() =>
              push("Thanks for the feedback! (rating submission wired to a follow-up endpoint)", "info")
            }
          >
            Submit rating
          </Button>
        </Card>
      )}
    </div>
  );
}
