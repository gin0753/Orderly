/** @jest-environment jsdom */
import { ApiError } from "@/lib/api-fetch";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { RegistrationVerification } from "@/features/customer-auth/components/registration-verification";
import { RegistrationPending } from "@/features/customer-auth/components/registration-pending";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { makeStore } from "@/store/store";

jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { checkRegistration: jest.fn(), completeRegistration: jest.fn(), resendRegistration: jest.fn() } }));
jest.mock("@/features/customer-auth/api/customer-api-fetch", () => ({ customerClient: { invalidate: jest.fn() } }));
jest.mock("@/features/customer-auth/lib/session-events", () => ({ publishCustomerSessionEvent: jest.fn() }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const secret = "a".repeat(43);
beforeEach(() => { jest.clearAllMocks(); window.history.replaceState(null, "", `/verify-email#token=${secret}`); });

it("checks without consuming the link; validates passwords and activates only on explicit submission", async () => {
  api.checkRegistration.mockResolvedValue({ status: "pending" });
  const customer = { id: "verified", email: "owner@example.test", name: "Owner", phone: null, authMethods: { password: true, google: false } };
  api.completeRegistration.mockResolvedValue({ user: customer });
  const store = makeStore();
  render(<Provider store={store}><RegistrationVerification /></Provider>);
  await screen.findByRole("form", { name: "Finish registration" });
  expect(api.completeRegistration).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText("Name"), "Owner");
  await userEvent.type(screen.getByLabelText("Password", { exact: true }), "short");
  await userEvent.type(screen.getByLabelText("Confirm password"), "short");
  await userEvent.click(screen.getByRole("button", { name: "Verify email and create account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("at least 15 characters");
  expect(api.completeRegistration).not.toHaveBeenCalled();
  await userEvent.clear(screen.getByLabelText("Password", { exact: true }));
  await userEvent.clear(screen.getByLabelText("Confirm password"));
  await userEvent.type(screen.getByLabelText("Password", { exact: true }), "Owner chosen password 123");
  await userEvent.type(screen.getByLabelText("Confirm password"), "Owner chosen password 123");
  await userEvent.click(screen.getByRole("button", { name: "Verify email and create account" }));
  await screen.findByRole("heading", { name: "Email verified" });
  expect(store.getState().customerAuth.customer).toEqual(customer);
  expect(window.location.hash).toBe("");
});

it("announces invalid links and never calls activation", async () => {
  api.checkRegistration.mockRejectedValue(new ApiError(400, "invalid"));
  render(<Provider store={makeStore()}><RegistrationVerification /></Provider>);
  expect(await screen.findByRole("alert")).toHaveTextContent("invalid or expired");
  expect(api.completeRegistration).not.toHaveBeenCalled();
});

it("announces delivery failure, enforces cooldown and allows retry after it expires", async () => {
  api.resendRegistration.mockResolvedValue({ status: "pending", retryAfterSeconds: 60 });
  render(<RegistrationPending email="owner@example.test" initial={{ status: "delivery_failed", retryAfterSeconds: 0 }} onRestart={jest.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("delivery failed");
  await userEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
  await waitFor(() => expect(api.resendRegistration).toHaveBeenCalledWith("owner@example.test"));
  expect(screen.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
