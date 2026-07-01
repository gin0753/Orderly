import { apiFetch } from "@/lib/api-fetch";
import type { AdminAuthResponse, AdminLoginInput } from "../types";

export const authApi = {
  login(input: AdminLoginInput) {
    return apiFetch<AdminAuthResponse>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },

  getCurrentAdmin() {
    return apiFetch<AdminAuthResponse>("/auth/me", {
      auth: "required",
    });
  },

  logout() {
    return apiFetch<void>("/auth/logout", {
      method: "POST",
    });
  },
};
