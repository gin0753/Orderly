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
import type { ComponentProps } from "react";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/features/checkout/api/create-order", () => ({ createOrder: jest.fn() }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { logout: jest.fn() } }));
const orderApi = createOrder as jest.MockedFunction<typeof createOrder>;
const authApi = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const alice: PublicCustomer = { id: "alice", name: "Alice", email: "alice@example.test", phone: "+61 400 000 001", authMethods: { password: true, google: false } };

function show(customer: PublicCustomer | null = alice, configuredDeliveryFeeCents?: number, settings: Partial<ComponentProps<typeof CheckoutPageClient>> = {}, subtotalCents = 1500) {
  const store = makeStore();
  store.dispatch(hydrateCart({ items: [{ key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: subtotalCents }, quantity: 1, selectedOptions: [], unitPriceCents: subtotalCents }] }));
  if (customer) {
    store.dispatch(bootstrapCustomer.pending("customer", undefined));
    store.dispatch(bootstrapCustomer.fulfilled(customer, "customer", undefined));
  }
  render(<Provider store={store}><CheckoutPageClient configuredDeliveryFeeCents={configuredDeliveryFeeCents} {...settings} /></Provider>);
  return store;
}

beforeEach(() => { jest.resetAllMocks(); sessionStorage.clear(); });

it("disables delivery while pickup remains selected and can submit", async () => {
  const user = userEvent.setup();
  show(alice, 725, { deliveryEnabled: false });
  const delivery = await screen.findByRole("button", { name: /Delivery/ });
  expect(delivery).toBeDisabled();
  await user.click(delivery);
  expect(screen.getByRole("button", { name: /Pickup/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("textbox", { name: "Address" })).not.toBeInTheDocument();
  expect(screen.getAllByText("$16.20").length).toBeGreaterThanOrEqual(2);
  orderApi.mockRejectedValueOnce(new ApiError(503, "Unavailable"));
  await user.click(screen.getByRole("button", { name: /^Place Order$/ }));
  expect(orderApi).toHaveBeenCalledWith(expect.objectContaining({ fulfillmentType: "PICKUP" }), { expectCustomer: true });
});

it("resolves a disabled pickup default to delivery and keeps pickup unavailable", async () => {
  const user = userEvent.setup();
  show(alice, 725, { pickupEnabled: false });
  const pickup = await screen.findByRole("button", { name: /Pickup/ });
  expect(pickup).toBeDisabled();
  await user.click(pickup);
  expect(screen.getByRole("button", { name: /Delivery/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("textbox", { name: "Address" })).toBeInTheDocument();
  expect(screen.getAllByText("$23.45").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByRole("button", { name: /^Place Order$/ })).toBeEnabled();
});

it("explains the subtotal minimum before submission for both methods and unlocks when the cart qualifies", async () => {
  const user = userEvent.setup();
  const store = show(alice, 725, { minimumOrderAmountCents: 2000 });
  expect(await screen.findByText("Minimum order $20.00")).toBeInTheDocument();
  expect(screen.getByText(/Add \$5.00 more/)).toHaveTextContent("before fees");
  for (const button of screen.getAllByRole("button", { name: /^Place Order/ })) expect(button).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /Delivery/ }));
  // Delivery and service fees do not count toward the backend's subtotal minimum.
  expect(screen.getAllByText("$23.45").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByRole("button", { name: /^Place Order$/ })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /^Place Order$/ }));
  expect(orderApi).not.toHaveBeenCalled();
  act(() => store.dispatch(hydrateCart({ items: store.getState().cart.items.map((item) => ({ ...item, quantity: 2 })) })));
  expect(screen.queryByText("Minimum order $20.00")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Place Order$/ })).toBeEnabled();
});

it("allows an exact-minimum pickup order without delivery fees", async () => {
  const user = userEvent.setup();
  show(alice, 725, { minimumOrderAmountCents: 1500, deliveryEnabled: false });
  const submit = await screen.findByRole("button", { name: /^Place Order$/ });
  expect(submit).toBeEnabled();
  expect(screen.queryByText(/Minimum order/)).not.toBeInTheDocument();
  orderApi.mockResolvedValueOnce({ orderId: "order", orderNumber: "10001", status: "PENDING", paymentStatus: "UNPAID", orderType: "PICKUP", totalCents: 1620, createdAt: new Date().toISOString() });
  await user.click(submit);
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("totalCents=1620")));
  expect(orderApi).toHaveBeenCalledTimes(1);
});

it("blocks both submit controls when neither fulfillment method is enabled", async () => {
  show(alice, 725, { pickupEnabled: false, deliveryEnabled: false });
  expect(await screen.findByRole("heading", { name: "Ordering is paused" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Pickup/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Delivery/ })).toBeDisabled();
  for (const button of screen.getAllByRole("button", { name: /Ordering paused/ })) expect(button).toBeDisabled();
  expect(orderApi).not.toHaveBeenCalled();
});

it("keeps the configured delivery fee free at the existing $50 subtotal threshold", async () => {
  const user = userEvent.setup();
  show(alice, 725, {}, 5000);
  await user.click(await screen.findByRole("button", { name: /Delivery/ }));
  expect(screen.getAllByText("$0.00")).toHaveLength(3);
  expect(screen.getAllByText("$51.20").length).toBeGreaterThanOrEqual(2);
  expect(screen.queryByText(/away from free delivery/)).not.toBeInTheDocument();
});

it("recovers a stale delivery restriction to pickup without pausing the store", async () => {
  const user = userEvent.setup();
  show();
  await user.click(await screen.findByRole("button", { name: /Delivery/ }));
  await user.type(screen.getByRole("textbox", { name: "Address" }), "10 Main Street");
  await user.type(screen.getByRole("textbox", { name: "City" }), "Sydney");
  await user.selectOptions(screen.getByRole("combobox", { name: "State" }), "NSW");
  await user.type(screen.getByRole("textbox", { name: "Postcode" }), "2000");
  orderApi.mockRejectedValueOnce(new ApiError(400, "Delivery is not currently available."));
  await user.click(screen.getByRole("button", { name: /^Place Order$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Delivery is currently unavailable");
  expect(screen.queryByRole("heading", { name: "Ordering is paused" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Delivery/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Pickup/ })).toHaveAttribute("aria-pressed", "true");
  orderApi.mockRejectedValueOnce(new ApiError(503, "Unavailable"));
  await user.click(screen.getByRole("button", { name: /^Place Order$/ }));
  expect(orderApi).toHaveBeenLastCalledWith(expect.objectContaining({ fulfillmentType: "PICKUP" }), { expectCustomer: true });
});

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

it("shows the configured delivery fee and consistent totals in both checkout summaries", async () => {
  const user = userEvent.setup();
  show(alice, 725);
  await user.click(await screen.findByRole("button", { name: /Delivery/ }));
  expect(screen.getAllByText("$7.25")).toHaveLength(3);
  expect(screen.getAllByText("$23.45").length).toBeGreaterThanOrEqual(2);
  await user.click(screen.getByRole("button", { name: /Pickup/ }));
  expect(screen.getAllByText("$7.25")).toHaveLength(1);
  expect(screen.getAllByText("$16.20").length).toBeGreaterThanOrEqual(2);
});

it("reaches success after a persisted order even when tracking storage is unavailable", async () => {
  const user = userEvent.setup();
  const store = show();
  orderApi.mockResolvedValueOnce({
    orderId: "order",
    orderNumber: "10001",
    status: "PENDING",
    paymentStatus: "UNPAID",
    orderType: "PICKUP",
    totalCents: 1620,
    createdAt: new Date().toISOString(),
  });
  const storage = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
  try {
    await user.click(
      await screen.findByRole("button", { name: /^Place Order$/ }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/order-success?"),
      ),
    );
    expect(orderApi).toHaveBeenCalledTimes(1);
    expect(store.getState().cart.items).toHaveLength(0);
  } finally {
    storage.mockRestore();
  }
});
