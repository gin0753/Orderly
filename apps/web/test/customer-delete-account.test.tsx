/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { QueryClient } from "@tanstack/react-query";
import { CustomerDeleteAccount } from "@/features/customer-auth/components/customer-delete-account";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { customerSessionReplaced } from "@/features/customer-auth/store/customer-auth-slice";
import { registerCustomerPrivateQueryClient } from "@/features/customer-auth/lib/private-data";
import { clearDeletedCustomerData } from "@/features/customer-auth/lib/deletion-cleanup";
import { saveTrackingLookup, getTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";
import { ApiError } from "@/lib/api-fetch";
import { makeStore } from "@/store/store";

const replace = jest.fn();
let params = new URLSearchParams();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }), useSearchParams: () => params }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { deleteAccount: jest.fn(), googleDeleteStart: jest.fn(), deletionStatus: jest.fn(), me: jest.fn() } }));
jest.mock("@/features/customer-auth/api/customer-api-fetch", () => ({ customerClient: { invalidate: jest.fn() } }));
const publish = jest.fn();
jest.mock("@/features/customer-auth/lib/session-events", () => ({ publishCustomerSessionEvent: (value: unknown) => publish(value) }));
jest.mock("@/features/customer-auth/lib/google-navigation", () => ({ navigateToGoogle: jest.fn() }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const customer = { id: "delete-owner", email: "owner@example.test", name: "Owner", phone: null, authMethods: { password: true, google: false } };
beforeEach(() => {
  jest.clearAllMocks(); sessionStorage.clear(); params = new URLSearchParams();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  api.me.mockResolvedValue({ user: customer });
});
function setup(password = true) {
  const store = makeStore(); store.dispatch(customerSessionReplaced({ ...customer, authMethods: { password, google: !password } }));
  render(<Provider store={store}><CustomerDeleteAccount /></Provider>);
  return store;
}
it("defaults to Cancel, requires password and explicit confirmation, clears only customer private data", async () => {
  const store = setup();
  const client = new QueryClient(); const cleanup = registerCustomerPrivateQueryClient(client);
  client.setQueryData(["customer-private", "orders"], ["private"]); client.setQueryData(["menu"], ["public"]);
  store.dispatch({ type: "auth/unsupported-admin-action" });
  const adminBefore = store.getState().auth;
  saveTrackingLookup({ orderNumber: "guest", receiptCode: "g".repeat(43) });
  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  expect(screen.getByRole("button", { name: "Permanently delete account" })).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Current password to delete account"), "Delete owner password 123");
  await userEvent.click(screen.getByRole("checkbox"));
  api.deleteAccount.mockResolvedValue({ clearSavedReceipt: false });
  await userEvent.click(screen.getByRole("button", { name: "Permanently delete account" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  expect(api.deleteAccount).toHaveBeenCalledWith({ confirmation: "DELETE", currentPassword: "Delete owner password 123", savedReceiptNumber: "guest" });
  expect(store.getState().customerAuth.customer).toBeNull(); expect(store.getState().auth).toEqual(adminBefore);
  expect(client.getQueryData(["customer-private", "orders"])).toBeUndefined(); expect(client.getQueryData(["menu"])).toEqual(["public"]);
  expect(getTrackingLookup()?.orderNumber).toBe("guest");
  expect(publish).toHaveBeenCalledWith({ type: "deleted", customerId: customer.id }); cleanup(); client.clear();
});
it("focuses failure feedback, preserves the account on API failure, and supports retry", async () => {
  const store = setup();
  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  await userEvent.type(screen.getByLabelText("Current password to delete account"), "Delete owner password 123");
  await userEvent.click(screen.getByRole("checkbox"));
  api.deleteAccount.mockRejectedValueOnce(new ApiError(409, "Complete or resolve your active orders before deleting your account."));
  await userEvent.click(screen.getByRole("button", { name: "Permanently delete account" }));
  expect(await screen.findByRole("alert")).toHaveFocus();
  expect(store.getState().customerAuth.customer?.id).toBe(customer.id); expect(replace).not.toHaveBeenCalled();
  api.deleteAccount.mockResolvedValue({ clearSavedReceipt: false });
  await userEvent.click(screen.getByRole("button", { name: "Permanently delete account" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
});
it("does not trust a verified URL parameter; Google-only needs a server-confirmed live grant", async () => {
  params = new URLSearchParams("deletion=verified"); api.deletionStatus.mockResolvedValue({ ready: false });
  setup(false); await waitFor(() => expect(api.deletionStatus).toHaveBeenCalled());
  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Permanently delete account" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Verify identity with Google" })).toBeEnabled();
});
it("clears owner-tagged receipts while preserving unrelated guest receipts", () => {
  saveTrackingLookup({ orderNumber: "owned", receiptCode: "o".repeat(43), customerUserId: customer.id });
  clearDeletedCustomerData(customer.id); expect(getTrackingLookup()).toBeNull();
  saveTrackingLookup({ orderNumber: "guest", receiptCode: "g".repeat(43) });
  clearDeletedCustomerData(customer.id); expect(getTrackingLookup()?.orderNumber).toBe("guest");
});
