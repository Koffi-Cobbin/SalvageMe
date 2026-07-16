import { apiClient, ApiClientError } from "./api-client";
import { useSessionStore } from "./stores/session-store";

// The real refresh token is an httpOnly cookie set by the API on its own
// domain (salvageme.pythonanywhere.com), scoped to /api/v1/auth/. That
// cookie is never visible to JavaScript, and — because the API is
// cross-origin from this Next.js app — it's also never visible to our own
// Next.js server, so middleware.ts can't read it to gate routes.
//
// To still get a redirect-before-render UX, we set a small first-party,
// non-sensitive hint cookie on *our own* domain whenever we know the user
// is signed in. It carries no auth value by itself — every real
// authorization check still happens against the API, which returns 401s
// that bootstrapSession/api-client handle regardless of this cookie's
// state. Losing or spoofing this cookie can only ever cause a redirect to
// /login (safe) or a page render that then fails its data fetch (also
// safe) — never bypass real auth.
const SESSION_HINT_COOKIE = "sm_session";

function setSessionHint() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=1; path=/; max-age=1209600; SameSite=Lax`;
}

function clearSessionHint() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

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
    setSessionHint();
  } catch {
    setUser(null);
    clearSessionHint();
  }
}

export async function login(username: string, password: string) {
  const { user } = await apiClient.login(username, password);
  useSessionStore.getState().setUser(user);
  setSessionHint();
  return user;
}

export async function register(input: {
  username: string;
  password: string;
  email?: string;
  role?: "donor" | "recipient" | "both";
  phone?: string;
}) {
  const { user } = await apiClient.register(input);
  useSessionStore.getState().setUser(user);
  setSessionHint();
  return user;
}

export async function logout() {
  try {
    await apiClient.logout();
  } catch {
    // Even if the network call fails, still clear local state below —
    // there's no safe way to keep the UI "logged in" if the user asked to
    // log out.
  }
  useSessionStore.getState().logout();
  clearSessionHint();
}

export { ApiClientError };
