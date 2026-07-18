import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Modal } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { Listing } from "@/types";

export function RequestListingButton({ listing }: { listing: Listing }) {
  const [, setLocation] = useLocation();
  const { user } = useSessionStore();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const request = useMutation({
    mutationFn: () => apiClient.requestListing(listing.id, message || undefined),
    onSuccess: () => {
      push("Request sent! Head to Requests to see the status.", "success");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["listing", listing.id] });
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.code === "duplicate_request") {
          push("You already have a pending request for this book.", "info");
          setOpen(false);
          return;
        }
        push(err.message, "error");
      } else {
        push("Couldn't send your request. Please try again.", "error");
      }
    },
  });

  if (listing.status !== "available") return null;
  if (user?.id === listing.owner.id) return null;

  function handleClick() {
    if (!user) {
      setLocation(`/login?returnTo=/listings/${listing.id}`);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button onClick={handleClick} className="w-full sm:w-auto">
        Request this book
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Request this book">
        <p className="mb-4 text-sm text-ink-700">
          <strong>{listing.owner.username}</strong> will receive your request and can accept or decline it.
          The book stays available until they accept.
        </p>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-800">
            Add a note (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-paper-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-500"
            placeholder="Tell them a bit about yourself or why you'd like this book…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={request.isPending} onClick={() => request.mutate()}>
            Send request
          </Button>
        </div>
      </Modal>
    </>
  );
}
