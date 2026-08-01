import { get, post } from "@/lib/api/client";
import type { AuthTokens, LoginRequest, User } from "@/types/api";

export const authApi = {
  login: (data: LoginRequest) => post<AuthTokens>("/auth/login", data),

  logout: (refreshToken: string) =>
    post("/auth/logout", { refresh_token: refreshToken }),

  refresh: (refreshToken: string) =>
    post<AuthTokens>("/auth/refresh", { refresh_token: refreshToken }),

  me: () => get<User>("/auth/me"),

  forgotPassword: (email: string) => post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    post("/auth/reset-password", { token, password }),
};
