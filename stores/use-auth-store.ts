import { create } from "zustand";

interface AuthState {
  currentOrgId: string | null;
  setCurrentOrgId: (orgId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentOrgId: null,
  setCurrentOrgId: (orgId) => set({ currentOrgId: orgId }),
}));
