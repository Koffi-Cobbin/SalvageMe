import { apiClient, ApiClientError } from "./api-client";
import { useSessionStore } from "./stores/session-store";

const SESSION_HINT_COOKIE = "sm_session";

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
    // Even if the network call fails, clear local state.
  }
  useSessionStore.getState().logout();
  clearSessionHint();
}

export { ApiClientError };
