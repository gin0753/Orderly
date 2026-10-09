/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { SiteHeader } from "@/components/layout/site-header";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { bootstrapCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { hydrateCart } from "@/features/cart/cart-slice";
import { makeStore } from "@/store/store";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { me: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn() } }));
jest.mock("@/features/customer-auth/api/customer-api-fetch", () => ({ customerClient: { invalidate: jest.fn() } }));
jest.mock("@/features/customer-auth/lib/session-events", () => ({ publishCustomerSessionEvent: jest.fn() }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const customer = { id: "customer", email: "ada@example.test", name: "Ada", phone: null, authMethods: { password: true, google: false } };

beforeEach(() => {
  pathname = "/"; jest.clearAllMocks();
  window.matchMedia = jest.fn().mockImplementation(() => ({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
});

it("shows guest navigation without dead account/order links", () => {
  const store = makeStore();
  render(<Provider store={store}><SiteHeader /></Provider>);
  const desktop = screen.getByRole("navigation", { name: "Primary navigation" });
  expect(within(desktop).getByRole("link", { name: "Menu" })).toBeInTheDocument();
  expect(within(desktop).getByRole("link", { name: "Track order" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", expect.stringContaining("/login?returnTo="));
  expect(within(desktop).queryByRole("link", { name: "Orders" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open cart" })).toBeInTheDocument();
});

it("shows authenticated order navigation and preserves the cart on logout", async () => {
  const store = makeStore();
  const requestId = "auth";
  store.dispatch(bootstrapCustomer.pending(requestId, undefined));
  store.dispatch(bootstrapCustomer.fulfilled(customer, requestId, undefined));
  store.dispatch(hydrateCart({ items: [{ key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: 1000 }, selectedOptions: [], quantity: 1, unitPriceCents: 1000 }] }));
  api.logout.mockResolvedValue(undefined);
  render(<Provider store={store}><SiteHeader /></Provider>);
  const desktop = screen.getByRole("navigation", { name: "Primary navigation" });
  expect(within(desktop).getByRole("link", { name: "Track order" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Account options" }));
  expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account#profile");
  expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/account/orders");
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(api.logout).toHaveBeenCalledTimes(1);
  expect(store.getState().customerAuth.status).toBe("unauthenticated");
  expect(store.getState().cart.items).toHaveLength(1);
  expect(store.getState().auth.status).toBe("checking");
});
