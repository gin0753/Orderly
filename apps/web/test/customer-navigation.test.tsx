/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";
import { hydrateCart, openCart } from "@/features/cart/cart-slice";
import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { OrderTrackingResult } from "@/features/order-tracking/components/result/order-tracking-result";
import { lookupGuestOrder } from "@/features/order-tracking/api/order-tracking-api";
import { saveTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminHeader } from "@/components/layout/admin-header";
import CustomerLayout from "@/app/(customer)/layout";
import TrackOrderPage from "@/app/(customer)/track-order/page";

const pushMock = jest.fn();
let pathname = "/checkout";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathname,
}));
jest.mock("@/features/order-tracking/api/order-tracking-api", () => ({
  lookupGuestOrder: jest.fn(),
  OrderTrackingLookupError: class OrderTrackingLookupError extends Error {
    kind = "unavailable";
  },
  TRACKING_UNAVAILABLE_MESSAGE:
    "Tracking is temporarily unavailable. Try again in a moment.",
}));

beforeEach(() => {
  window.sessionStorage.clear();
  pathname = "/checkout";
});

it("uses one customer header on tracking with Track order active and a working cart", async () => {
  pathname = "/track-order";
  const page = await TrackOrderPage({ searchParams: Promise.resolve({ orderNumber: "ORD-123" }) });
  const store = makeStore();
  render(<Provider store={store}><CustomerLayout>{page}</CustomerLayout></Provider>);
  expect(screen.getAllByRole("banner")).toHaveLength(1);
  expect(within(screen.getByRole("navigation", { name: "Primary navigation" })).getByRole("link", { name: "Track order" })).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link", { name: "Menu" })).toHaveLength(2);
  expect(screen.queryByRole("link", { name: "Back to menu" })).not.toBeInTheDocument();
  expect(screen.getByDisplayValue("ORD-123")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Open cart" }));
  expect(screen.getByRole("button", { name: "Browse menu" })).toBeInTheDocument();
});

it("closes the empty drawer and returns to the menu", async () => {
  const store = makeStore();
  store.dispatch(openCart());
  render(<Provider store={store}><CartDrawer /></Provider>);
  await userEvent.click(screen.getByRole("button", { name: "Browse menu" }));
  expect(store.getState().cart.isCartOpen).toBe(false);
  expect(pushMock).toHaveBeenCalledWith("/");
});

it("edits the cart in checkout while preserving entered customer details", async () => {
  const store = makeStore();
  store.dispatch(hydrateCart({ items: [{
    key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: 1500 },
    quantity: 1, selectedOptions: [], unitPriceCents: 1500,
  }] }));
  render(<Provider store={store}><CheckoutPageClient /><CartDrawer /></Provider>);
  await userEvent.type(screen.getByRole("textbox", { name: "Full name" }), "Sam Customer");
  await userEvent.click(screen.getAllByRole("button", { name: "Edit cart" })[0]);
  expect(store.getState().cart.isCartOpen).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Close cart" }));
  expect(screen.getByRole("textbox", { name: "Full name" })).toHaveValue("Sam Customer");
  expect(pushMock).not.toHaveBeenCalled();
  expect(screen.queryByText("Review")).not.toBeInTheDocument();
  expect(screen.getByText("Confirmed")).toBeInTheDocument();
});

it("keeps checkout review and fees available while preserving delivery details across fulfillment changes", async () => {
  const store = makeStore();
  store.dispatch(hydrateCart({ items: [{
    key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: 1500 },
    quantity: 2, selectedOptions: [{
      id: "large", optionGroupId: "size", optionGroupName: "Size",
      kind: "SIZE", name: "Large", priceDeltaCents: 200,
    }], unitPriceCents: 1700,
  }] }));
  render(<Provider store={store}><CheckoutPageClient /></Provider>);
  const review = within(screen.getByRole("complementary", { name: "Order review" }));
  expect(review.getByText("Pizza")).toBeInTheDocument();
  expect(review.getByText("Large")).toBeInTheDocument();
  expect(review.getByText("Qty: 2")).toBeInTheDocument();
  expect(review.getByText("Subtotal")).toBeInTheDocument();
  expect(review.getByText("Service fee")).toBeInTheDocument();
  expect(review.getByText("$35.20")).toBeInTheDocument();
  expect(review.getByRole("button", { name: "Edit cart" })).toBeInTheDocument();
  expect(review.queryByRole("button", { name: "Place Order" })).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "Address" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Have your order delivered/ }));
  await userEvent.type(screen.getByRole("textbox", { name: "Address" }), "10 Example Street");
  expect(review.getByText("$3.99")).toBeInTheDocument();
  expect(review.getByText("$39.19")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Collect your order/ }));
  expect(screen.queryByRole("textbox", { name: "Address" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Have your order delivered/ }));
  expect(screen.getByRole("textbox", { name: "Address" })).toHaveValue("10 Example Street");
});

it("requires contact verification and preserves the order number on recovery", async () => {
  render(<OrderTrackingResult orderNumber="ORD-123&next=/admin" />);
  await userEvent.click(await screen.findByRole("button", { name: "Track order" }));
  expect(lookupGuestOrder).not.toHaveBeenCalled();
  expect(pushMock).toHaveBeenCalledWith("/track-order?orderNumber=ORD-123%26next%3D%2Fadmin");
});

it("preserves the order number when a verified lookup fails", async () => {
  saveTrackingLookup({ orderNumber: "ORD-123", email: "sam@example.com" });
  jest.mocked(lookupGuestOrder).mockRejectedValue(new Error("Unable to load order"));
  render(<OrderTrackingResult orderNumber="ORD-123" />);
  await userEvent.click(await screen.findByRole("button", { name: "Re-enter details" }));
  expect(lookupGuestOrder).toHaveBeenCalledWith({ orderNumber: "ORD-123", email: "sam@example.com", phone: undefined });
  expect(pushMock).toHaveBeenCalledWith("/track-order?orderNumber=ORD-123");
});

it("exposes only implemented customer and admin header destinations", () => {
  const store = makeStore();
  const view = render(<Provider store={store}><SiteHeader /></Provider>);
  expect(screen.getByRole("link", { name: "Track order" })).toHaveAttribute("href", "/track-order");
  expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute("href", "/");
  for (const name of ["Deals", "Catering", "About"]) {
    expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
  }
  view.rerender(<Provider store={store}><AdminHeader /></Provider>);
  expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/admin/orders");
  expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute("href", "/admin/menu");
  for (const name of ["Customers", "Reports", "Settings"]) {
    expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
  }
  expect(screen.getByRole("button", { name: "Open admin navigation" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /search|notification/i })).not.toBeInTheDocument();
});
