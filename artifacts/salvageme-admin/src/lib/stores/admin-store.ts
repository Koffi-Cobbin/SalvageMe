import { create } from "zustand";
import type { AdminMe } from "@/types";

interface AdminState {
  adminMe: AdminMe | null;
  setAdminMe: (me: AdminMe) => void;
  clear: () => void;
  hasCapability: (cap: string) => boolean;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  adminMe: null,
  setAdminMe: (adminMe) => set({ adminMe }),
  clear: () => set({ adminMe: null }),
  hasCapability: (cap) => get().adminMe?.capabilities.includes(cap) ?? false,
}));
