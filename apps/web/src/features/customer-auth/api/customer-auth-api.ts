import { customerApiFetch, customerClient } from "./customer-api-fetch";
import type { CustomerAuthResponse, CustomerLoginInput, CustomerRegisterInput, RegistrationResponse } from "../types";

export const customerAuthApi = {
  me: () => customerApiFetch<CustomerAuthResponse>("/customer/auth/me", { auth: "required" }),
  login: (input: CustomerLoginInput) => customerClient.sessionLock(() => customerApiFetch<CustomerAuthResponse>("/customer/auth/login", { method: "POST", body: JSON.stringify(input) })),
  register: (input: CustomerRegisterInput) => customerClient.sessionLock(() => customerApiFetch<RegistrationResponse>("/customer/auth/register", { method: "POST", body: JSON.stringify(input) })),
  resendRegistration: (email: string) => customerApiFetch<RegistrationResponse>("/customer/auth/registration/resend", { method: "POST", body: JSON.stringify({ email }) }),
  checkRegistration: (token: string) => customerApiFetch<{ status: "pending" }>("/customer/auth/registration/check", { method: "POST", body: JSON.stringify({ token }) }),
  completeRegistration: (input: { token: string; password: string; name: string }) => customerClient.sessionLock(() => customerApiFetch<CustomerAuthResponse>("/customer/auth/registration/complete", { method: "POST", body: JSON.stringify(input) })),
  logout: () => customerClient.sessionLock(() => customerApiFetch<void>("/customer/auth/logout", { method: "POST" })),
  googleStatus: () => customerApiFetch<{ enabled: boolean }>("/customer/auth/google/status"),
  googleStart: (returnTo: string) => customerClient.sessionLock(() => customerApiFetch<{ authorizationUrl: string }>("/customer/auth/google/start", { method: "POST", body: JSON.stringify({ returnTo }) })),
  googleConnect: (password: string) => customerClient.sessionLock(() => customerApiFetch<{ authorizationUrl: string }>("/customer/auth/google/connect", { method: "POST", body: JSON.stringify({ password }), auth: "required" })),
  deletionStatus: () => customerApiFetch<{ ready: boolean }>("/customer/account/deletion/status", { auth: "required" }),
  googleDeleteStart: async () => {
    await customerApiFetch<CustomerAuthResponse>("/customer/auth/me", { auth: "required" });
    return customerClient.sessionLock(() => customerApiFetch<{ authorizationUrl: string }>("/customer/auth/google/delete-account", { method: "POST" }));
  },
  deleteAccount: async (input: { confirmation: "DELETE"; currentPassword?: string; savedReceiptNumber?: string }) => {
    await customerApiFetch<CustomerAuthResponse>("/customer/auth/me", { auth: "required" });
    return customerClient.sessionLock(() => customerApiFetch<{ clearSavedReceipt: boolean }>("/customer/account/delete", { method: "POST", body: JSON.stringify(input) }));
  },
  updateProfile: (input: { name?: string; phone?: string | null }) => customerApiFetch<CustomerAuthResponse>("/customer/account", { method: "PATCH", body: JSON.stringify(input), auth: "required" }),
  changePassword: async (input: { currentPassword: string; newPassword: string }) => {
    await customerApiFetch<CustomerAuthResponse>("/customer/auth/me", { auth: "required" });
    return customerClient.sessionLock(() => customerApiFetch<CustomerAuthResponse>("/customer/account/password", { method: "POST", body: JSON.stringify(input) }));
  },
};
