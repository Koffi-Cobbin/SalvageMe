"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Modal, Input } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import { useSessionStore } from "@/lib/stores/session-store";
import { useRouter } from "next/navigation";

export function RequestListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const push = useToastStore((s) => s.push);
  const { status } = useSessionStore();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => apiClient.requestListing(listingId, message),
    onSuccess: () => {
      push("Request sent! You'll be notified when the donor responds.", "success");
      setOpen(false);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        const friendly: Record<string, string> = {
          self_request: "You can't request your own listing.",
          listing_unavailable: "This listing isn't available anymore.",
          duplicate_request: "You already have a pending request on this listing.",
        };
        push(friendly[err.code] ?? err.message, "error");
        return;
      }
      push("Couldn't send your request. Please try again.", "error");
    },
  });

  function handleOpen() {
    if (status !== "authenticated") {
      router.push(`/login?returnTo=/listings/${listingId}`);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button size="lg" onClick={handleOpen} className="w-full sm:w-auto">
        Request this item
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Request this book">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Tell the donor a bit about why you'd like it"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="e.g. This would go straight into our classroom's reading corner."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Send request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
