/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import CustomerError from "@/app/(customer)/error";
import NotFound from "@/app/not-found";
import { CustomerShell } from "@/components/layout/customer-shell";
import { openCart, hydrateCart } from "@/features/cart/cart-slice";
import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";
import { setCartOpener } from "@/features/cart/utils/cart-focus";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { getMenu } from "@/features/menu/api/get-menu";
import { EmptyMenuState } from "@/features/menu/components/empty-menu-state";
import { MenuBrowser } from "@/features/menu/components/menu-browser";
import type { MenuCategory } from "@/features/menu/types";
import { makeStore } from "@/store/store";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

jest.mock("@/features/menu/api/get-menu", () => ({ getMenu: jest.fn() }));

const categories: MenuCategory[] = [
  {
    id: "pizza",
    name: "Pizza",
    slug: "pizza",
    sortOrder: 1,
    products: [
      {
        id: "test-pizza",
        name: "Test Pizza",
        description: "A test pizza",
        imageUrl: null,
        priceCents: 1500,
        isAvailable: true,
        optionGroups: [],
      },
    ],
  },
];

function renderWithStore(node: React.ReactNode) {
  const store = makeStore();
  return {
    store,
    ...render(<Provider store={store}>{node}</Provider>),
  };
}

beforeEach(() => {
  jest.mocked(getMenu).mockResolvedValue({
    store: {
      name: "Orderly Kitchen",
      isAcceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      estimatedPreparationMinutes: 20,
      deliveryFee: "3.99",
      minimumOrderAmount: "0.00",
    },
    categories,
  });
});

it("renders one customer banner, main and content-info landmark with only approved footer links", () => {
  renderWithStore(
    <CustomerShell>
      <h1>Page content</h1>
    </CustomerShell>,
  );

  expect(screen.getAllByRole("banner")).toHaveLength(1);
  expect(screen.getAllByRole("main")).toHaveLength(1);
  expect(screen.getAllByRole("contentinfo")).toHaveLength(1);

  const footerNavigation = screen.getByRole("navigation", {
    name: "Footer navigation",
  });
  const links = within(footerNavigation).getAllByRole("link");
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveTextContent("Menu");
  expect(links[0]).toHaveAttribute("href", "/");
  expect(links[1]).toHaveTextContent("Track order");
  expect(links[1]).toHaveAttribute("href", "/track-order");
});

it("focuses the customer error heading and retries through the route reset callback", async () => {
  const reset = jest.fn();
  render(<CustomerError reset={reset} />);

  expect(
    screen.getByRole("heading", { name: "We couldn’t load this page" }),
  ).toHaveFocus();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledTimes(1);
});

it("uses the customer shell and approved recovery destinations for 404s", () => {
  renderWithStore(<NotFound />);

  expect(screen.getAllByRole("banner")).toHaveLength(1);
  expect(screen.getAllByRole("main")).toHaveLength(1);
  expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Browse menu" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(
    screen
      .getAllByRole("link", { name: "Track order" })
      .every((link) => link.getAttribute("href") === "/track-order"),
  ).toBe(true);
});

it("keeps the empty-menu state distinct and performs a real route refresh", async () => {
  render(<EmptyMenuState />);

  expect(
    screen.getByRole("heading", { name: "Menu coming soon" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Ordering is paused")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Refresh menu" }));
  expect(refreshMock).toHaveBeenCalledTimes(1);
});

it("keeps paused products browsable while disabling quick add and modal add", async () => {
  renderWithStore(
    <MenuBrowser categories={categories} isAcceptingOrders={false} />,
  );

  expect(
    screen.getByRole("heading", { name: "Ordering is paused" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "View Test Pizza" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Paused" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Ordering paused for Test Pizza" }),
  ).toBeDisabled();

  await userEvent.click(screen.getByRole("button", { name: "View Test Pizza" }));
  expect(screen.getByRole("dialog", { name: "Test Pizza" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ordering paused" })).toBeDisabled();
});

it("preserves checkout details and cart editing while paused", async () => {
  const store = makeStore();
  store.dispatch(
    hydrateCart({
      items: [
        {
          key: "pizza",
          product: { id: "pizza", name: "Pizza", priceCents: 1500 },
          quantity: 1,
          selectedOptions: [],
          unitPriceCents: 1500,
        },
      ],
    }),
  );
  render(
    <Provider store={store}>
      <CheckoutPageClient initialIsAcceptingOrders={false} />
    </Provider>,
  );

  const nameField = await screen.findByRole("textbox", { name: "Full name" });
  await userEvent.type(nameField, "Sam Customer");
  for (const submitButton of screen.getAllByRole("button", {
    name: "Ordering paused",
  })) {
    expect(submitButton).toBeDisabled();
  }
  await userEvent.click(screen.getByRole("button", { name: "Edit cart" }));
  expect(store.getState().cart.isCartOpen).toBe(true);
  expect(nameField).toHaveValue("Sam Customer");
});

it("names and focuses the cart dialog, then restores the exact opener", async () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <button
        type="button"
        onClick={(event) => {
          setCartOpener(event.currentTarget);
          store.dispatch(openCart());
        }}
      >
        Test cart opener
      </button>
      <CartDrawer />
    </Provider>,
  );

  const opener = screen.getByRole("button", { name: "Test cart opener" });
  await userEvent.click(opener);
  const dialog = screen.getByRole("dialog", { name: "Your Cart" });
  expect(screen.getByRole("button", { name: "Close cart" })).toHaveFocus();

  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
  expect(opener).toHaveFocus();
});

it("moves focus from the product dialog into the cart and restores the product opener", async () => {
  renderWithStore(
    <>
      <MenuBrowser categories={categories} isAcceptingOrders />
      <CartDrawer />
    </>,
  );

  const opener = screen.getByRole("button", { name: "View Test Pizza" });
  await userEvent.click(opener);
  expect(screen.getByRole("button", { name: "Close product details" })).toHaveFocus();
  await userEvent.click(screen.getByRole("button", { name: /^Add to cart/ }));

  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Your Cart" })).toHaveAttribute(
      "open",
    ),
  );
  expect(screen.getByRole("button", { name: "Close cart" })).toHaveFocus();
  await userEvent.click(screen.getByRole("button", { name: "Close cart" }));
  expect(opener).toHaveFocus();
});
