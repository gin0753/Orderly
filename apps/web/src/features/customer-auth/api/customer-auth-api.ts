import { customerApiFetch, customerClient } from "./customer-api-fetch";
import type { CustomerAuthResponse, CustomerLoginInput, CustomerRegisterInput } from "../types";

export const customerAuthApi = {
  me: () => customerApiFetch<CustomerAuthResponse>("/customer/auth/me", { auth: "required" }),
  login: (input: CustomerLoginInput) => customerClient.sessionLock(() => customerApiFetch<CustomerAuthResponse>("/customer/auth/login", { method: "POST", body: JSON.stringify(input) })),
  register: (input: CustomerRegisterInput) => customerClient.sessionLock(() => customerApiFetch<CustomerAuthResponse>("/customer/auth/register", { method: "POST", body: JSON.stringify(input) })),
  logout: () => customerClient.sessionLock(() => customerApiFetch<void>("/customer/auth/logout", { method: "POST" })),
  googleStatus: () => customerApiFetch<{ enabled: boolean }>("/customer/auth/google/status"),
  googleStart: (returnTo: string) => customerClient.sessionLock(() => customerApiFetch<{ authorizationUrl: string }>("/customer/auth/google/start", { method: "POST", body: JSON.stringify({ returnTo }) })),
  googleConnect: (password: string) => customerClient.sessionLock(() => customerApiFetch<{ authorizationUrl: string }>("/customer/auth/google/connect", { method: "POST", body: JSON.stringify({ password }), auth: "required" })),
  updateProfile: (input: { name?: string; phone?: string | null }) => customerApiFetch<CustomerAuthResponse>("/customer/account", { method: "PATCH", body: JSON.stringify(input), auth: "required" }),
  changePassword: async (input: { currentPassword: string; newPassword: string }) => {
    await customerApiFetch<CustomerAuthResponse>("/customer/auth/me", { auth: "required" });
    return customerClient.sessionLock(() => customerApiFetch<CustomerAuthResponse>("/customer/account/password", { method: "POST", body: JSON.stringify(input) }));
  },
};
