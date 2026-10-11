/** @jest-environment jsdom */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";
import { addItem, hydrateCart, openCart, closeCart, updateQuantity } from "@/features/cart/cart-slice";
import { createCartItem } from "@/features/cart/cart-utils";
import { getMenu } from "@/features/menu/api/get-menu";
import { MenuBrowser } from "@/features/menu/components/menu-browser";
import { makeStore } from "@/store/store";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/features/menu/api/get-menu", () => ({ getMenu: jest.fn() }));
const item = createCartItem({ product: { id: "pizza", name: "Pizza", priceCents: 1400 }, selectedOptions: [{ id: "large", optionGroupId: "size", optionGroupName: "Size", kind: "SIZE", name: "Large", priceDeltaCents: 400 }], quantity: 1 });
const menu = { store: { name: "Test", isAcceptingOrders: true, pickupEnabled: true, deliveryEnabled: true, estimatedPreparationMinutes: 20, deliveryFee: "5.00", minimumOrderAmount: "0.00" }, categories: [{ id: "pizza", name: "Pizza", slug: "pizza", sortOrder: 0, products: [{ id: "pizza", name: "Pizza", priceCents: 1400, isAvailable: true, optionGroups: [{ id: "size", name: "Size", kind: "SIZE" as const, type: "SINGLE" as const, isRequired: true, minSelect: 1, maxSelect: 1, options: [{ id: "large", name: "Large", priceDelta: "4.00", priceDeltaCents: 400, isDefault: true, isAvailable: true }] }] }] }] };

beforeEach(() => { jest.mocked(getMenu).mockResolvedValue(menu); });
function show() {
  const store = makeStore();
  render(<Provider store={store}><CartDrawer /></Provider>);
  return store;
}

it("announces quick add in the cart while keeping the storefront message passive", async () => {
  const store = makeStore();
  const categories = menu.categories.map((category) => ({ ...category, products: category.products.map((product) => ({ ...product, optionGroups: [] })) }));
  render(<Provider store={store}><MenuBrowser categories={categories} isAcceptingOrders /><CartDrawer /></Provider>);
  await userEvent.click(screen.getByRole("button", { name: "Quick add Pizza" }));
  const dialog = screen.getByRole("dialog", { name: "Your Cart" });
  await waitFor(() => expect(dialog.querySelector(".transaction-cart-feedback")).toHaveTextContent("Added 1 × Pizza. 1 in cart."));
  expect(screen.getByText("Added 1 × Pizza to your cart.")).not.toHaveAttribute("role", "status");
  expect(within(dialog).getByRole("button", { name: "Close cart" })).toHaveFocus();
});

it("announces initial and repeated additions once inside the modal, without replay on ordinary reopen", async () => {
  const store = show();
  act(() => { store.dispatch(addItem(item)); store.dispatch(openCart()); });
  const dialog = screen.getByRole("dialog", { name: "Your Cart" });
  const feedback = dialog.querySelector(".transaction-cart-feedback")!;
  await waitFor(() => expect(feedback).toHaveTextContent("Added 1 × Pizza. 1 in cart."));
  expect(feedback).toHaveAttribute("role", "status");
  expect(feedback).toHaveAttribute("aria-atomic", "true");
  act(() => store.dispatch(addItem(item)));
  await waitFor(() => expect(feedback).toHaveTextContent("Added 1 × Pizza. 2 in cart."));
  expect(store.getState().cart.items).toHaveLength(1);
  expect(store.getState().cart.items[0].selectedOptions).toEqual(item.selectedOptions);
  await userEvent.click(within(dialog).getByRole("button", { name: "Close cart" }));
  act(() => store.dispatch(openCart()));
  await waitFor(() => expect(dialog.querySelector(".transaction-cart-feedback")).not.toHaveTextContent("Added"));
});

it("announces quantity/removal/clear and keeps focus in the dialog when an item disappears", async () => {
  const store = show();
  act(() => { store.dispatch(hydrateCart({ items: [item] })); store.dispatch(openCart()); });
  const dialog = screen.getByRole("dialog", { name: "Your Cart" });
  const feedback = () => dialog.querySelector(".transaction-cart-feedback")!;
  await userEvent.click(within(dialog).getByRole("button", { name: "Increase quantity for Pizza" }));
  await waitFor(() => expect(feedback()).toHaveTextContent("Pizza: quantity 2."));
  await userEvent.click(within(dialog).getByRole("button", { name: "Remove Pizza" }));
  await waitFor(() => expect(feedback()).toHaveTextContent("Removed Pizza"));
  expect(within(dialog).getByRole("button", { name: "Close cart" })).toHaveFocus();
  expect(within(dialog).getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  act(() => store.dispatch(addItem(item)));
  await userEvent.click(within(dialog).getByRole("button", { name: "Clear cart" }));
  await waitFor(() => expect(feedback()).toHaveTextContent("Cart cleared."));
  act(() => { store.dispatch(closeCart()); store.dispatch(addItem(item)); store.dispatch(updateQuantity({ key: item.key, quantity: 2 })); store.dispatch(openCart()); });
  await waitFor(() => expect(feedback()).not.toHaveTextContent("quantity 2"));
});

it("presents current catalog unavailability without rewriting persisted item identity or totals", async () => {
  jest.mocked(getMenu).mockResolvedValue({ ...menu, categories: [] });
  const store = show();
  act(() => { store.dispatch(hydrateCart({ items: [item] })); store.dispatch(openCart()); });
  expect(await screen.findByText(/Item or selected option is currently unavailable/)).toBeVisible();
  expect(store.getState().cart.items[0]).toEqual(item);
  expect(screen.getByRole("link", { name: "Continue to checkout" })).toHaveAttribute("href", "/checkout");
});

it("retains paused and failed-availability recovery with cart editing", async () => {
  jest.mocked(getMenu).mockResolvedValueOnce({ ...menu, store: { ...menu.store, isAcceptingOrders: false } }).mockRejectedValueOnce(new Error("Offline"));
  const store = show();
  act(() => { store.dispatch(hydrateCart({ items: [item] })); store.dispatch(openCart()); });
  expect(await screen.findByRole("button", { name: "Ordering paused" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Increase quantity for Pizza" })).toBeEnabled();
  await userEvent.click(screen.getByRole("button", { name: "Close cart" }));
  act(() => store.dispatch(openCart()));
  expect(await screen.findByRole("button", { name: "Checkout unavailable" })).toBeDisabled();
  expect(screen.getByText(/Close and reopen the cart/)).toBeVisible();
});
