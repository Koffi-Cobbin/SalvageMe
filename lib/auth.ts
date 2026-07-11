import { apiClient, ApiClientError } from "./api-client";
import { useSessionStore } from "./stores/session-store";

/**
 * Call once on app mount (see AppProviders). Attempts a silent refresh via
 * the httpOnly cookie and, on success, loads the current user. If it fails,
 * we mark the session unauthenticated — this is expected for first-time or
 * signed-out visitors and is not an error state to surface to the user.
 */
export async function bootstrapSession() {
  const { setStatus, setUser } = useSessionStore.getState();
  setStatus("loading");
  try {
    await apiClient.refresh();
    const user = await apiClient.me();
    setUser(user);
  } catch (err) {
    if (err instanceof ApiClientError && err.status !== 401) {
      // Non-auth failure (network, 5xx) — still land on signed-out, but this
      // is where you'd hook in error reporting.
    }
    setUser(null);
  }
}

export async function login(email: string, password: string) {
  const { user } = await apiClient.login(email, password);
  useSessionStore.getState().setUser(user);
  return user;
}

export async function register(input: { email: string; password: string; displayName: string }) {
  const { user } = await apiClient.register(input);
  useSessionStore.getState().setUser(user);
  return user;
}

export function logout() {
  useSessionStore.getState().logout();
  // Live adapter: also call a /auth/logout/ endpoint to clear the refresh
  // cookie server-side. Not in the given contract, so left as a follow-up.
}
