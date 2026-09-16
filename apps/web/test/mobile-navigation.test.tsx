/** @jest-environment jsdom */

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminHeader } from "@/components/layout/admin-header";
import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";
import { hydrateCart, openCart } from "@/features/cart/cart-slice";
import { loginAdmin } from "@/features/auth/store/auth-slice";
import { authApi } from "@/features/auth/api/auth-api";
import { makeStore } from "@/store/store";

let pathname = "/track-order";
const replaceMock = jest.fn();
const pushMock = jest.fn();
let desktop = false;
let resizeListener: (() => void) | undefined;

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
}));
jest.mock("@/features/auth/api/auth-api", () => ({ authApi: { logout: jest.fn() } }));

beforeAll(() => {
  // jsdom has no native dialog top layer. Browser verification covers inertness.
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() { return desktop; },
    addEventListener: (_event: string, listener: () => void) => { resizeListener = listener; },
    removeEventListener: () => { resizeListener = undefined; },
  }));
});

beforeEach(() => {
  pathname = "/track-order";
  desktop = false;
  document.body.style.overflow = "auto";
  document.documentElement.style.overflow = "scroll";
  jest.mocked(authApi.logout).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

function renderHeader(audience: "customer" | "admin" = "customer") {
  const store = makeStore();
  store.dispatch(loginAdmin.fulfilled({ id: "admin", email: "admin@example.com", role: "ADMIN" }, "test", { email: "admin@example.com", password: "unused" }));
  const view = render(<Provider store={store}>
    {audience === "customer" ? <><SiteHeader /><CartDrawer /></> : <AdminHeader />}
  </Provider>);
  return { store, ...view };
}

async function openNavigation(audience: "customer" | "admin" = "customer") {
  const trigger = screen.getByRole("button", { name: `Open ${audience} navigation` });
  await userEvent.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog", { name: `${audience === "customer" ? "Customer" : "Admin"} navigation` }) };
}

it("exposes customer ARIA state, isolated links and current destination", async () => {
  renderHeader();
  const trigger = screen.getByRole("button", { name: "Open customer navigation" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  const { dialog } = await openNavigation();
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveAttribute("aria-controls", dialog.id);
  expect(dialog).toHaveAttribute("aria-modal", "true");
  const links = within(dialog).getAllByRole("link");
  expect(links.map(link => [link.textContent, link.getAttribute("href")])).toEqual([["Menu", "/"], ["Orders", "/track-order"]]);
  expect(links[1]).toHaveAttribute("aria-current", "page");
  expect(links[0]).not.toHaveAttribute("aria-current");
  expect(within(dialog).queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
});

it("exposes only admin links, with nested Menu active and bottom Sign out", async () => {
  pathname = "/admin/menu/products";
  renderHeader("admin");
  const { dialog } = await openNavigation("admin");
  const links = within(dialog).getAllByRole("link");
  expect(links.map(link => [link.textContent, link.getAttribute("href")])).toEqual([["Orders", "/admin/orders"], ["Menu", "/admin/menu"]]);
  expect(links[1]).toHaveAttribute("aria-current", "location");
  expect(within(dialog).getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

it.each(["close", "escape", "backdrop", "link", "cancel"])("closes via %s and restores focus and scrolling", async (method) => {
  renderHeader();
  const { trigger, dialog } = await openNavigation();
  const close = within(dialog).getByRole("button", { name: "Close customer navigation" });
  expect(close).toHaveFocus();
  expect(document.body.style.overflow).toBe("hidden");
  expect(document.documentElement.style.overflow).toBe("hidden");
  if (method === "close") await userEvent.click(close);
  if (method === "escape") await userEvent.keyboard("{Escape}");
  if (method === "backdrop") fireEvent.click(dialog);
  if (method === "link") {
    const link = within(dialog).getByRole("link", { name: "Orders" });
    // Exercise the close handler without jsdom attempting a document navigation.
    link.addEventListener("click", event => event.preventDefault());
    await userEvent.click(link);
  }
  if (method === "cancel") fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe("auto");
  expect(document.documentElement.style.overflow).toBe("scroll");
});

it("does not close on interior clicks and cycles keyboard focus", async () => {
  renderHeader();
  const { dialog } = await openNavigation();
  await userEvent.click(within(dialog).getByText("Orderly"));
  expect(dialog).toBeVisible();
  const close = within(dialog).getByRole("button", { name: "Close customer navigation" });
  close.focus();
  await userEvent.tab({ shift: true });
  expect(within(dialog).getByRole("link", { name: "Orders" })).toHaveFocus();
  await userEvent.tab();
  expect(close).toHaveFocus();
  await userEvent.tab();
  expect(within(dialog).getByRole("link", { name: "Menu" })).toHaveFocus();
});

it("restores scrolling on unmount", async () => {
  const view = renderHeader();
  await openNavigation();
  view.unmount();
  expect(document.body.style.overflow).toBe("auto");
  expect(document.documentElement.style.overflow).toBe("scroll");
});

it("closes when resizing to desktop and leaves desktop links available", async () => {
  renderHeader();
  const { trigger } = await openNavigation();
  act(() => { desktop = true; resizeListener?.(); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  const nav = screen.getByRole("navigation", { name: "Primary navigation" });
  expect(within(nav).getByRole("link", { name: "Menu" })).toHaveAttribute("href", "/");
  expect(within(nav).getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/track-order");
});

it("keeps the cart badge and closes an existing cart before opening navigation", async () => {
  const { store } = renderHeader();
  act(() => store.dispatch(hydrateCart({ items: [{ key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: 1000 }, quantity: 2, selectedOptions: [], unitPriceCents: 1000 }] })));
  const cart = screen.getByRole("button", { name: "Open cart" });
  expect(within(cart).getByText("2")).toBeInTheDocument();
  act(() => store.dispatch(openCart()));
  await openNavigation();
  expect(store.getState().cart.isCartOpen).toBe(false);
  expect(document.body.style.overflow).toBe("hidden");
  await userEvent.keyboard("{Escape}");
  await userEvent.click(cart);
  expect(screen.getByRole("heading", { name: "Your Cart" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Close cart" }));
  expect(store.getState().cart.isCartOpen).toBe(false);
  expect(document.body.style.overflow).toBe("auto");
});

it.each(["header", "drawer"])("uses the existing logout flow from the %s", async (location) => {
  pathname = "/admin/orders";
  const { store } = renderHeader("admin");
  if (location === "drawer") {
    const { dialog } = await openNavigation("admin");
    await userEvent.click(within(dialog).getByRole("button", { name: "Sign out" }));
  } else {
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  }
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/admin/login"));
  expect(authApi.logout).toHaveBeenCalledTimes(1);
  expect(store.getState().auth.status).toBe("unauthenticated");
});

it("does not redirect or discard the session when logout fails", async () => {
  jest.mocked(authApi.logout).mockRejectedValue(new Error("Unavailable"));
  const { store } = renderHeader("admin");
  const { dialog } = await openNavigation("admin");
  await userEvent.click(within(dialog).getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(store.getState().auth.error).toBe("Unable to sign out. Please try again."));
  expect(store.getState().auth.status).toBe("authenticated");
  expect(replaceMock).not.toHaveBeenCalled();
  expect(dialog).toBeVisible();
});
