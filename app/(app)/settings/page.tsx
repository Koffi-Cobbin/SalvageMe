"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Input, VerifiedBadge } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

export default function SettingsPage() {
  const { user, setUser } = useSessionStore();
  const push = useToastStore((s) => s.push);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [city, setCity] = useState(user?.city ?? "");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setCity(user.city ?? "");
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => apiClient.updateMe({ displayName, city }),
    onSuccess: (updated) => {
      setUser(updated);
      push("Profile updated.", "success");
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't save your changes.", "error"),
  });

  return (
    <div className="container-page max-w-lg py-10">
      <h1 className="text-display-md">Settings</h1>

      <section className="mt-8 rounded-xl2 border border-paper-300 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Verification status</h2>
          {user?.verified ? (
            <VerifiedBadge />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-700/70">
              <ShieldCheck size={16} aria-hidden="true" /> Not verified
            </span>
          )}
        </div>
        <p className="text-sm text-ink-700/80">
          Verified accounts build trust in the community. Verification review is handled by our team —
          flagged as a follow-up integration once the backend exposes an endpoint for it.
        </p>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Button type="submit" loading={mutation.isPending} className="self-start">
          Save changes
        </Button>
      </form>
    </div>
  );
}
