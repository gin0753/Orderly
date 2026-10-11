/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CartItemRow } from "@/features/cart/components/cart-drawer/cart-item-row";
import { CustomerOrdersPage } from "@/features/customer-orders/customer-orders-page";
import { AdminOrdersFilters } from "@/features/admin-orders/components/admin-orders-filters";
import { AdminOrdersSummary } from "@/features/admin-orders/components/admin-orders-summary";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("status=READY&sort=oldest&page=2"),
}));
jest.mock("@/store/hooks", () => ({
  useAppSelector: () => "fixture-customer",
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    isPending: false,
    isError: false,
    isFetching: false,
    data: {
      data: [
        {
          id: "fixture-order",
          orderNumber: "10001",
          status: "READY",
          orderType: "PICKUP",
          itemCount: 2,
          totalCents: 2400,
          createdAt: "2026-10-09T03:00:00Z",
        },
      ],
      meta: { totalItems: 12, page: 2, totalPages: 3 },
    },
  }),
}));

function evidence(name: string, html: string, theme = "customer-theme") {
  const phase = process.env.ORDERLY_CLEANUP_CAPTURE_PHASE;
  if (!phase) return;
  const directory = path.resolve(
    process.cwd(),
    "../../audit-artifacts/pre-packaging",
    phase,
  );
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, `${name}.html`),
    `<main class="${theme}" style="padding:16px;max-width:1200px;margin:auto">${html}</main>`,
  );
}

it("preserves cart item content, remove and quantity actions", () => {
  const onRemove = jest.fn();
  const onQuantityChange = jest.fn();
  const { container } = render(
    <CartItemRow
      item={{
        key: "fixture",
        product: {
          id: "pizza",
          name: "Roasted Mushroom Pizza",
          imageUrl: "/images/menu/roasted-mushroom-pizza-v1.webp",
          priceCents: 1800,
        },
        quantity: 2,
        unitPriceCents: 2000,
        selectedOptions: [
          {
            id: "extra",
            optionGroupId: "extras",
            optionGroupName: "Extras",
            kind: "ADD_ON",
            name: "Extra roasted mushrooms and fresh herbs",
            priceDeltaCents: 200,
          },
        ],
      }}
      onRemove={onRemove}
      onQuantityChange={onQuantityChange}
    />,
  );
  expect(screen.getByText("$40.00")).toBeInTheDocument();
  expect(screen.getByText(/Extra roasted mushrooms/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Remove Roasted Mushroom Pizza" }),
  );
  expect(onRemove).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Increase quantity for Roasted Mushroom Pizza",
    }),
  );
  expect(onQuantityChange).toHaveBeenCalledWith(3);
  evidence("cart", container.innerHTML);
});

it("preserves history status/sort URL state and pagination links", () => {
  const { container } = render(<CustomerOrdersPage />);
  const status = screen.getByRole("navigation", {
    name: "Filter orders by status",
  });
  const sort = screen.getByRole("navigation", { name: "Sort orders" });
  expect(status.querySelectorAll("a")).toHaveLength(7);
  expect(sort.querySelectorAll("a")).toHaveLength(4);
  expect(screen.getByRole("link", { name: "Ready" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(screen.getByRole("link", { name: "Oldest first" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(
    screen.getByRole("link", { name: "Newest first" }).getAttribute("href"),
  ).toContain("status=READY");
  expect(
    new URL(
      screen.getByRole("link", { name: "Newest first" }).getAttribute("href")!,
      "http://localhost",
    ).searchParams.get("page") ?? "1",
  ).toBe("1");
  expect(
    screen.getByRole("link", { name: "Next" }).getAttribute("href"),
  ).toContain("page=3");
  evidence("history", container.innerHTML);
});

it("preserves Admin search and status/fulfillment controls", () => {
  const onSearchTermChange = jest.fn();
  const onOrderTypeChange = jest.fn();
  const onStatusChange = jest.fn();
  const { container } = render(
    <AdminOrdersFilters
      filters={{ status: "READY" }}
      searchTerm=""
      visibleOrderCount={4}
      totalOrderCount={12}
      onSearchTermChange={onSearchTermChange}
      onOrderTypeChange={onOrderTypeChange}
      onStatusChange={onStatusChange}
      onClearFilters={jest.fn()}
    />,
  );
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "pizza" } });
  if (process.env.ORDERLY_CLEANUP_CAPTURE_PHASE !== "before") {
    expect(
      screen.getByRole("textbox", {
        name: "Search orders, customers or items",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Filters" }),
    ).not.toBeInTheDocument();
  }
  expect(onSearchTermChange).toHaveBeenCalledWith("pizza");
  fireEvent.click(screen.getByRole("button", { name: "Delivery" }));
  expect(onOrderTypeChange).toHaveBeenCalledWith("DELIVERY");
  evidence("admin-toolbar", container.innerHTML, "admin-theme");
});

it("preserves all five Admin metrics and helpers", () => {
  const { container } = render(
    <AdminOrdersSummary
      summary={{
        total: 25,
        pending: 3,
        accepted: 4,
        preparing: 5,
        ready: 6,
        completed: 7,
        cancelled: 0,
      }}
    />,
  );
  for (const label of [
    "New",
    "Accepted",
    "Preparing",
    "Ready",
    "Completed",
    "Needs attention",
    "Fulfilled orders",
  ])
    expect(screen.getByText(label)).toBeInTheDocument();
  evidence("admin-metrics", container.innerHTML, "admin-theme");
});
