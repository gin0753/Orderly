/** @jest-environment jsdom */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { hydrateCart } from "@/features/cart/cart-slice";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { createOrder } from "@/features/checkout/api/create-order";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { bootstrapCustomer, customerSessionExpired } from "@/features/customer-auth/store/customer-auth-slice";
import type { PublicCustomer } from "@/features/customer-auth/types";
import { ApiError } from "@/lib/api-fetch";
import { makeStore } from "@/store/store";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/features/checkout/api/create-order", () => ({ createOrder: jest.fn() }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { logout: jest.fn() } }));
const orderApi = createOrder as jest.MockedFunction<typeof createOrder>;
const authApi = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const alice: PublicCustomer = { id: "alice", name: "Alice", email: "alice@example.test", phone: "+61 400 000 001", authMethods: { password: true, google: false } };

function show(customer: PublicCustomer | null = alice) {
  const store = makeStore();
  store.dispatch(hydrateCart({ items: [{ key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: 1500 }, quantity: 1, selectedOptions: [], unitPriceCents: 1500 }] }));
  if (customer) {
    store.dispatch(bootstrapCustomer.pending("customer", undefined));
    store.dispatch(bootstrapCustomer.fulfilled(customer, "customer", undefined));
  }
  render(<Provider store={store}><CheckoutPageClient /></Provider>);
  return store;
}

beforeEach(() => { jest.resetAllMocks(); sessionStorage.clear(); });

it("prefills after delayed bootstrap without replacing an edited contact field", async () => {
  const user = userEvent.setup();
  const store = show(null);
  await user.type(await screen.findByRole("textbox", { name: "Phone number" }), "User phone");
  act(() => {
    store.dispatch(bootstrapCustomer.pending("later", undefined));
    store.dispatch(bootstrapCustomer.fulfilled(alice, "later", undefined));
  });
  expect(screen.getByRole("textbox", { name: "Full name" })).toHaveValue("Alice");
  expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue("alice@example.test");
  expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue("User phone");
});

it("offers explicit terminal-expiry recovery and submits as guest only after clearing the session", async () => {
  const user = userEvent.setup();
  const store = show();
  await user.clear(await screen.findByRole("textbox", { name: "Phone number" }));
  await user.type(screen.getByRole("textbox", { name: "Phone number" }), "+61 400 123 456");
  orderApi.mockRejectedValueOnce(new ApiError(401, "Your session expired."));
  await user.click(screen.getByRole("button", { name: /^Place Order$/ }));
  expect(await screen.findByRole("button", { name: "Continue as guest" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login?returnTo=%2Fcheckout");
  expect(orderApi).toHaveBeenCalledTimes(1);
  expect(orderApi).toHaveBeenCalledWith(expect.anything(), { expectCustomer: true });
  expect(store.getState().cart.items).toHaveLength(1);
  expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue("+61 400 123 456");
  authApi.logout.mockResolvedValue(undefined);
  await user.click(screen.getByRole("button", { name: "Continue as guest" }));
  await waitFor(() => expect(authApi.logout).toHaveBeenCalledTimes(1));
  expect(orderApi).toHaveBeenCalledTimes(1);
  expect(store.getState().customerAuth.status).toBe("unauthenticated");
  expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue("+61 400 123 456");
  expect(store.getState().cart.items).toHaveLength(1);
  await user.type(screen.getByPlaceholderText("Enter your full name"), "Guest Person");
  await user.type(screen.getByPlaceholderText("you@email.com"), "guest@example.test");
  orderApi.mockResolvedValueOnce({ orderId: "order", orderNumber: "10001", status: "PENDING", paymentStatus: "UNPAID", orderType: "PICKUP", totalCents: 1620, createdAt: new Date().toISOString() });
  await user.click(screen.getByRole("button", { name: /^Place Order$/ }));
  await waitFor(() => expect(orderApi).toHaveBeenCalledTimes(2));
  expect(orderApi).toHaveBeenLastCalledWith(expect.anything(), { expectCustomer: false });
  expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/order-success?"));
});

it("blocks checkout when a background session expiry has cleared the customer", async () => {
  const user = userEvent.setup();
  const store = show();
  act(() => { store.dispatch(customerSessionExpired()); });
  expect(await screen.findByRole("button", { name: "Continue as guest" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Place Order$/ })).toBeDisabled();
  expect(orderApi).not.toHaveBeenCalled();
  expect(store.getState().cart.items).toHaveLength(1);
  authApi.logout.mockResolvedValue(undefined);
  await user.click(screen.getByRole("button", { name: "Continue as guest" }));
  await waitFor(() => expect(screen.getByRole("button", { name: /^Place Order$/ })).toBeEnabled());
});

it("keeps infrastructure failures on the retry path without offering guest continuation", async () => {
  const user = userEvent.setup();
  const store = show();
  orderApi.mockRejectedValueOnce(new ApiError(503, "Unavailable"));
  await user.click(await screen.findByRole("button", { name: /^Place Order$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t place your order");
  expect(screen.queryByRole("button", { name: "Continue as guest" })).not.toBeInTheDocument();
  expect(store.getState().cart.items).toHaveLength(1);
});
