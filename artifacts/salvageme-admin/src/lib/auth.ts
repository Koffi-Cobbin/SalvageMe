import { apiClient, ApiClientError } from "./api-client";
import { useSessionStore } from "./stores/session-store";

// Own cookie name — deliberately distinct from the public app's session-hint
// cookie. The real auth cookie is backend-owned/path-scoped; this is just a
// local "was I logged in last time" hint for this app only.
const SESSION_HINT_COOKIE = "sm_admin_session";

function setSessionHint() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=1; path=/; max-age=1209600; SameSite=Lax`;
}

function clearSessionHint() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

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

export async function logout() {
  try {
    await apiClient.logout();
  } catch {
    // Even if the network call fails, clear local state.
  }
  useSessionStore.getState().logout();
  clearSessionHint();
}

export { ApiClientError };
