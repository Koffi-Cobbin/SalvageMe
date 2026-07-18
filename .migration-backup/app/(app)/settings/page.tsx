"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, LogOut } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useSessionStore } from "@/lib/stores/session-store";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button, Input, Select, VerifiedBadge } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

export default function SettingsPage() {
  const { user, setUser } = useSessionStore();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState(user?.role ?? "both");

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setRole(user.role);
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => apiClient.updateMe({ email: email || undefined, phone: phone || undefined, role }),
    onSuccess: (updated) => {
      setUser(updated);
      push("Profile updated.", "success");
    },
    onError: (err) => push(err instanceof ApiClientError ? err.message : "Couldn't save your changes.", "error"),
  });

  async function handleLogout() {
    await logout();
    push("Signed out.", "info");
    router.push("/");
  }

  return (
    <div className="container-page max-w-lg py-10">
      <h1 className="text-display-md">Settings</h1>

      <section className="mt-8 rounded-xl2 border border-paper-300 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Verification status</h2>
          {user?.isVerified ? (
            <VerifiedBadge />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-700/70">
              <ShieldCheck size={16} aria-hidden="true" /> Not verified
            </span>
          )}
        </div>
        <p className="text-sm text-ink-700/80">
          Verified accounts build trust in the community. Verification review is handled by our
          team via Django Admin — there&apos;s currently no self-serve verification-request endpoint
          in the API.
        </p>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Select
          label="I'm mainly here to..."
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          options={[
            { value: "both", label: "Give and receive books" },
            { value: "donor", label: "Give books away" },
            { value: "recipient", label: "Find books" },
          ]}
        />
        <p className="text-xs text-ink-700/60">
          Your location is used for nearby search and is only shared with someone else once you&apos;re
          both party to an exchange. Update it from the create-listing form for now — a dedicated
          location picker here is a follow-up.
        </p>
        <Button type="submit" loading={mutation.isPending} className="self-start">
          Save changes
        </Button>
      </form>

      <div className="mt-10 border-t border-paper-300 pt-6">
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={16} className="mr-1.5" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </div>
  );
}
