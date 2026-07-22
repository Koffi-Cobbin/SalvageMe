import { useState } from "react";
import { Shield } from "lucide-react";
import { login, ApiClientError } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

export function LoginPage() {
  const push = useToastStore((s) => s.push);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(undefined);
    if (!username || !password) return;
    setSubmitting(true);
    try {
      // AdminGuard (in App.tsx) re-checks admin capabilities once the
      // session store updates and redirects non-admins away — nothing
      // further to do here regardless of whether this user is an admin.
      await login(username, password);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401 || err.status === 400) {
          setPasswordError("Incorrect username or password.");
        } else {
          push(err.message, "error");
        }
      } else {
        push("Something went wrong. Please try again.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 text-terracotta-400">
            <Shield size={22} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">SalvageMe Admin</h1>
          <p className="mt-1 text-sm text-ink-700/60">Sign in with your SalvageMe account.</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Log in
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-700/50">
          Access is limited to accounts with an assigned admin role.
        </p>
      </div>
    </div>
  );
}
