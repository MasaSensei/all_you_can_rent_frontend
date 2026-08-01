import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStore } from "@/lib/api/client";
import { authApi } from "@/lib/api/modules/auth";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenantId: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const tokens = await authApi.login({ email, password });
          tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
          tokenStore.setTenant(tokens.user.tenant_id);
          set({
            user: tokens.user,
            tenantId: tokens.user.tenant_id,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const refresh = tokenStore.getRefresh();
        if (refresh) {
          try {
            await authApi.logout(refresh);
          } catch {
            // Ignore — clear local state regardless
          }
        }
        tokenStore.clear();
        set({ user: null, tenantId: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),

      hydrate: async () => {
        const token = tokenStore.getAccess();
        if (!token) return;
        try {
          const user = await authApi.me();
          set({ user, tenantId: user.tenant_id, isAuthenticated: true });
        } catch {
          tokenStore.clear();
          set({ user: null, tenantId: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "rentos-auth",
      // Only persist non-sensitive metadata; tokens live in localStorage separately
      partialize: (state) => ({
        user: state.user,
        tenantId: state.tenantId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
