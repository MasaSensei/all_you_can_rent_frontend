import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import type { ApiResponse } from "@/types/api";

// ---- Constants ----

const TENANT_ID_KEY = "rentos_tenant_id";
const ACCESS_TOKEN_KEY = "rentos_access_token";
const REFRESH_TOKEN_KEY = "rentos_refresh_token";

// ---- Token helpers ----

export const tokenStore = {
  getAccess: () =>
    typeof window !== "undefined"
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null,
  getRefresh: () =>
    typeof window !== "undefined"
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null,
  getTenant: () =>
    typeof window !== "undefined" ? localStorage.getItem(TENANT_ID_KEY) : null,
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  setTenant: (tenantId: string) =>
    localStorage.setItem(TENANT_ID_KEY, tenantId),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TENANT_ID_KEY);
  },
};

// ---- Client factory ----

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function createApiClient(): AxiosInstance {
  const client = axios.create({
    // All requests go through the Next.js BFF proxy
    baseURL: "/api/proxy",
    headers: { "Content-Type": "application/json" },
    timeout: 30_000,
  });

  // ---- Request interceptor: inject auth + tenant headers ----
  client.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    const tenantId = tokenStore.getTenant();

    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) config.headers["X-Tenant-ID"] = tenantId;

    return config;
  });

  // ---- Response interceptor: unwrap envelope, handle 401 refresh ----
  client.interceptors.response.use(
    (response) => {
      // Unwrap the {success, data} envelope transparently.
      // Callers receive response.data = the inner `data` field.
      const envelope = response.data as ApiResponse<unknown>;
      if (envelope && "success" in envelope) {
        response.data = envelope.data;
        // Attach meta for paginated responses
        if (envelope.meta) {
          // @ts-expect-error — attach meta to response for use in hooks
          response.meta = envelope.meta;
        }
      }
      return response;
    },
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        const refreshToken = tokenStore.getRefresh();

        if (!refreshToken) {
          tokenStore.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Queue the request until token is refreshed
          return new Promise((resolve) => {
            refreshQueue.push((token) => {
              if (original.headers) {
                original.headers["Authorization"] = `Bearer ${token}`;
              }
              resolve(client(original));
            });
          });
        }

        isRefreshing = true;
        try {
          const { data } = await axios.post<
            ApiResponse<{ access_token: string; refresh_token: string }>
          >("/api/proxy/auth/refresh", { refresh_token: refreshToken });
          const tokens = data.data!;
          tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
          refreshQueue.forEach((cb) => cb(tokens.access_token));
          refreshQueue = [];
          if (original.headers) {
            original.headers["Authorization"] = `Bearer ${tokens.access_token}`;
          }
          return client(original);
        } catch {
          tokenStore.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Normalize error message from BE envelope
      const envelope = error.response?.data as ApiResponse<never> | undefined;
      const message =
        envelope?.message ?? error.message ?? "An unexpected error occurred";
      const code = envelope?.code ?? "UNKNOWN";

      return Promise.reject(
        Object.assign(new Error(message), {
          code,
          status: error.response?.status,
        }),
      );
    },
  );

  return client;
}

export const api = createApiClient();

// ---- Typed helpers ----

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<T>(url, { params });
  return res.data;
}

export async function post<T>(url: string, data?: unknown) {
  const res = await api.post<T>(url, data);
  return res.data;
}

export async function put<T>(url: string, data?: unknown) {
  const res = await api.put<T>(url, data);
  return res.data;
}

export async function patch<T>(url: string, data?: unknown) {
  const res = await api.patch<T>(url, data);
  return res.data;
}

export async function del<T>(url: string) {
  const res = await api.delete<T>(url);
  return res.data;
}
