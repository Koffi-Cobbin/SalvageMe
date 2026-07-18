import { useEffect, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button, Input, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { UserRole } from "@/types";

export function SettingsPage() {
  const { user, setUser } = useSessionStore();
  const push = useToastStore((s) => s.push);

  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "both");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setRole(user.role);
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiClient.updateMe({ email: email || undefined, phone: phone || undefined, role });
      setUser(updated);
      push("Settings saved.", "success");
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : "Couldn't save changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  if (!user) return null;

  return (
    <div className="container-page max-w-md py-10">
      <h1 className="text-display-md">Settings</h1>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
        <div>
          <p className="mb-4 text-sm font-semibold text-ink-800">Account</p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-800">Username</label>
              <input
                disabled
                value={user.username}
                className="rounded-lg border border-paper-300 bg-paper-100 px-3.5 py-2.5 text-ink-700 opacity-70"
              />
              <p className="text-xs text-ink-700/60">Username cannot be changed.</p>
            </div>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Select
              label="I want to…"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: "both", label: "Both give and receive books" },
                { value: "donor", label: "Donate books" },
                { value: "recipient", label: "Receive books" },
              ]}
            />
          </div>
        </div>

        <Button type="submit" loading={saving} className="mt-2">
          Save changes
        </Button>
      </form>

      <div className="mt-10 border-t border-paper-300 pt-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-800">Session</h2>
        <Button variant="danger" loading={loggingOut} onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
