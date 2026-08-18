import { api, setAccessToken } from "./client";
import type { Camera, CameraListResponse, MeResponse, TokenResponse, UserListResponse } from "./types";

export const authApi = {
  async login(email: string, password: string): Promise<MeResponse> {
    const tokens = await api.post<TokenResponse>("/api/v1/auth/login", { email, password });
    setAccessToken(tokens.access_token);
    return authApi.me();
  },
  me: () => api.get<MeResponse>("/api/v1/auth/me"),
  async logout(): Promise<void> {
    try {
      await api.post<void>("/api/v1/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },
};

export const camerasApi = {
  list: () => api.get<CameraListResponse>("/api/v1/cameras"),
  create: (payload: { name: string; description?: string; location?: string; stream_type?: string; stream_url?: string }) =>
    api.post<Camera>("/api/v1/cameras", payload),
  update: (id: string, payload: Partial<Pick<Camera, "name" | "description" | "location" | "status" | "enabled">>) =>
    api.patch<Camera>(`/api/v1/cameras/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/api/v1/cameras/${id}`),
};

export const usersApi = {
  list: () => api.get<UserListResponse>("/api/v1/users"),
  create: (payload: { email: string; password: string; full_name: string; role: string }) =>
    api.post<UserListResponse["items"][number]>("/api/v1/users", payload),
};
