import { create } from "zustand";
import type { User } from "@/types";

interface SessionState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setUser: (user: User | null) => void;
  setStatus: (status: SessionState["status"]) => void;
  logout: () => void;
}

// Deliberately NOT persisted to localStorage — the access token lives only
// in the api-client module's closure, and this store just mirrors "do we
// currently believe the user is signed in" for UI purposes. Actual auth
// state is re-derived from /users/me/ on load via lib/auth.ts.
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: "idle",
  setUser: (user) => set({ user, status: user ? "authenticated" : "unauthenticated" }),
  setStatus: (status) => set({ status }),
  logout: () => set({ user: null, status: "unauthenticated" }),
}));
