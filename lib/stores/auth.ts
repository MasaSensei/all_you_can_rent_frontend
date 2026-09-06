import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStore } from "@/lib/api/client";
import { authApi } from "@/lib/api/modules/auth";
import type { User } from "@/types/api";

// Helper — sync token ke cookie agar middleware bisa baca
function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
          // Sync ke cookie agar middleware bisa baca
          setCookie("rentos_access_token", tokens.access_token);
          setCookie("rentos_role", (tokens.user as any).role ?? "");
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
          } catch {}
        }
        tokenStore.clear();
        deleteCookie("rentos_access_token");
        deleteCookie("rentos_role");
        set({ user: null, tenantId: null, isAuthenticated: false });
      },

      hydrate: async () => {
        if (!tokenStore.getAccess()) return;
        try {
          const user = await authApi.me();
          // Pastikan cookie masih ada
          setCookie("rentos_access_token", tokenStore.getAccess()!);
          set({ user, tenantId: user.tenant_id, isAuthenticated: true });
        } catch {
          tokenStore.clear();
          deleteCookie("rentos_access_token");
          set({ user: null, tenantId: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "rentos-auth",
      partialize: (s) => ({
        user: s.user,
        tenantId: s.tenantId,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
