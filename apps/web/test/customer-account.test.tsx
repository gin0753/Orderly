/** @jest-environment jsdom */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { CustomerAccountProfile } from "@/features/customer-auth/components/customer-account-profile";
import { CustomerPasswordForm } from "@/features/customer-auth/components/customer-password-form";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { customerClient } from "@/features/customer-auth/api/customer-api-fetch";
import { bootstrapCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";
import type { PublicCustomer } from "@/features/customer-auth/types";

const mockPublish = jest.fn();
jest.mock("@/features/customer-auth/lib/session-events", () => ({ publishCustomerSessionEvent: (...args: unknown[]) => mockPublish(...args) }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { updateProfile: jest.fn(), changePassword: jest.fn() } }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const base: PublicCustomer = { id: "one", email: "customer@example.test", name: "Customer", phone: "+61 400 000 000", authMethods: { password: true, google: false } };

function show(customer: PublicCustomer = base) {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("first", undefined));
  store.dispatch(bootstrapCustomer.fulfilled(customer, "first", undefined));
  render(<Provider store={store}><CustomerAccountProfile /><CustomerPasswordForm /></Provider>);
  return store;
}

beforeEach(() => { jest.resetAllMocks(); });

it("shows read-only email, saves edited profile, and clears dirty state", async () => {
  const user = userEvent.setup();
  const store = show();
  expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
  expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
  await user.clear(screen.getByLabelText("Name"));
  await user.type(screen.getByLabelText("Name"), "  Updated Customer  ");
  expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  api.updateProfile.mockResolvedValue({ user: { ...base, name: "Updated Customer" } });
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ name: "Updated Customer" }));
  expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
  expect(store.getState().customerAuth.customer?.name).toBe("Updated Customer");
  expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
});

it("preserves unsaved edits through rehydration, validates fields, and clears phone", async () => {
  const user = userEvent.setup();
  const store = show();
  await user.clear(screen.getByLabelText("Name"));
  act(() => {
    store.dispatch(bootstrapCustomer.pending("second", undefined));
    store.dispatch(bootstrapCustomer.fulfilled({ ...base, phone: "+61 499 999 999" }, "second", undefined));
  });
  expect(screen.getByLabelText("Name")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  expect(screen.getByText("Enter a name of up to 120 characters.")).toBeInTheDocument();
  expect(api.updateProfile).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Name"), "Customer");
  await user.clear(screen.getByLabelText(/Phone/));
  api.updateProfile.mockResolvedValue({ user: { ...base, phone: null } });
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ phone: null }));
  expect(store.getState().customerAuth.customer?.phone).toBeNull();
});

it("keeps edits and reports an infrastructure save failure", async () => {
  const user = userEvent.setup();
  show();
  await user.clear(screen.getByLabelText(/Phone/));
  api.updateProfile.mockRejectedValue(new Error("offline"));
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t save");
  expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
});

it("changes password, replaces session identity, and broadcasts to other tabs", async () => {
  const user = userEvent.setup();
  const store = show();
  const invalidate = jest.spyOn(customerClient, "invalidate").mockImplementation(() => {});
  api.changePassword.mockResolvedValue({ user: base });
  await user.type(screen.getByLabelText("Current password"), "old password");
  await user.type(screen.getByLabelText("New password"), "A new password 123!");
  await user.type(screen.getByLabelText("Confirm new password"), "A new password 123!");
  await user.click(screen.getByRole("button", { name: "Change password" }));
  await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith({ currentPassword: "old password", newPassword: "A new password 123!" }));
  expect(await screen.findByText(/Other sessions have been signed out/)).toBeInTheDocument();
  expect(store.getState().customerAuth.status).toBe("authenticated");
  expect(screen.getByLabelText("Current password")).toHaveValue("");
  expect(invalidate).toHaveBeenCalled();
  expect(mockPublish).toHaveBeenCalledWith("changed");
  invalidate.mockRestore();
});

it("validates new passwords and shows current-password failure safely", async () => {
  const user = userEvent.setup();
  show();
  await user.type(screen.getByLabelText("Current password"), "wrong");
  await user.type(screen.getByLabelText("New password"), "short");
  await user.type(screen.getByLabelText("Confirm new password"), "different");
  await user.click(screen.getByRole("button", { name: "Change password" }));
  expect(screen.getByText("Use at least 15 characters.")).toBeInTheDocument();
  expect(screen.getByText("Your passwords don’t match.")).toBeInTheDocument();
  expect(api.changePassword).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText("New password"));
  await user.type(screen.getByLabelText("New password"), "A long new password 123!");
  await user.clear(screen.getByLabelText("Confirm new password"));
  await user.type(screen.getByLabelText("Confirm new password"), "A long new password 123!");
  api.changePassword.mockRejectedValue(new Error("Current password is incorrect."));
  await user.click(screen.getByRole("button", { name: "Change password" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
});

it("shows Google-only account without a password action", () => {
  show({ ...base, name: null, phone: null, authMethods: { password: false, google: true } });
  expect(screen.getByText("Password is not configured for this account.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Name")).toHaveValue("");
});
