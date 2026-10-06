/** @jest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { CustomerOrdersPage } from "@/features/customer-orders/customer-orders-page";
import { CustomerOrderDetailPage } from "@/features/customer-orders/customer-order-detail-page";
import { getCustomerOrder, getCustomerOrders } from "@/features/customer-orders/customer-orders-api";
import { bootstrapCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { ApiError } from "@/lib/api-fetch";
import { makeStore } from "@/store/store";

let currentSearch = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useSearchParams: () => currentSearch,
}));
jest.mock("@/features/customer-orders/customer-orders-api", () => ({
  ...jest.requireActual("@/features/customer-orders/customer-orders-api"),
  getCustomerOrders: jest.fn(), getCustomerOrder: jest.fn(),
}));
const list = getCustomerOrders as jest.MockedFunction<typeof getCustomerOrders>;
const detail = getCustomerOrder as jest.MockedFunction<typeof getCustomerOrder>;
const customer = { id: "owner", email: "owner@example.test", name: "Owner", phone: null, authMethods: { password: true, google: false } };

function show(view: React.ReactElement) {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("owner", undefined));
  store.dispatch(bootstrapCustomer.fulfilled(customer, "owner", undefined));
  const queries = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<Provider store={store}><QueryClientProvider client={queries}>{view}</QueryClientProvider></Provider>);
  return { store, queries };
}

beforeEach(() => { jest.resetAllMocks(); currentSearch = new URLSearchParams(); window.history.replaceState(null, "", "/account/orders"); });

test("list shows meaningful summaries and URL changes reset page", async () => {
  currentSearch = new URLSearchParams("page=2&sort=amount_high");
  list.mockResolvedValue({
    data: [{ id: "order-id", orderNumber: "12345", status: "READY", orderType: "DELIVERY", itemCount: 3, totalCents: 2820, createdAt: "2026-01-02T01:00:00.000Z" }],
    meta: { page: 2, pageSize: 10, totalItems: 21, totalPages: 3 },
  });
  show(<CustomerOrdersPage />);
  expect(await screen.findByRole("heading", { name: "Order #12345" })).toBeInTheDocument();
  expect(within(screen.getByRole("list", { name: "Your orders" })).getByText("Ready")).toBeInTheDocument();
  expect(screen.getByText(/Delivery · 3 items/)).toBeInTheDocument();
  expect(screen.getByText("$28.20")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View order" })).toHaveAttribute("href", "/account/orders/order-id");
  expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/account/orders?sort=amount_high");
  expect(within(screen.getByRole("navigation", { name: "Filter orders by status" })).getByRole("link", { name: "Completed" })).toHaveAttribute("href", "/account/orders?status=COMPLETED&sort=amount_high");
  expect(within(screen.getByRole("navigation", { name: "Sort orders" })).getByRole("link", { name: "Oldest first" })).toHaveAttribute("href", "/account/orders?sort=oldest");
});

test("list explains when the customer has never ordered while signed in", async () => {
  list.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } });
  const first = show(<CustomerOrdersPage />);
  expect(await screen.findByRole("heading", { name: "No signed-in orders yet" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse menu" })).toHaveAttribute("href", "/");
  first.queries.clear();
});

test("list gives a distinct filtered-empty state and retryable API error", async () => {
  currentSearch = new URLSearchParams("status=CANCELLED");
  list.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } });
  show(<CustomerOrdersPage />);
  expect(await screen.findByRole("heading", { name: "No matching orders" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Show all orders" })).toHaveAttribute("href", "/account/orders");
});

test("list exposes retry for infrastructure failures", async () => {
  list.mockRejectedValue(new ApiError(503, "Unavailable"));
  show(<CustomerOrdersPage />);
  expect(await screen.findByRole("alert", {}, { timeout: 5000 })).toHaveTextContent("couldn’t load your orders");
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
});

test("copied stale page offers a safe return to the last available page", async () => {
  currentSearch = new URLSearchParams("page=9&status=READY");
  list.mockResolvedValue({ data: [], meta: { page: 9, pageSize: 10, totalItems: 12, totalPages: 2 } });
  show(<CustomerOrdersPage />);
  expect(await screen.findByRole("heading", { name: "No orders on this page" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute("href", "/account/orders?status=READY&page=2");
});

test("detail renders stored snapshots and totals, then handles a scoped 404", async () => {
  detail.mockResolvedValue({
    id: "order-id", orderNumber: "12345", status: "COMPLETED", orderType: "DELIVERY",
    customer: { name: "Historical Name", email: "old@example.test", phone: "0400123456" },
    address: { addressLine1: "7 Old Street", addressLine2: "Unit 2", city: "Sydney", state: "NSW", postcode: "2000" },
    notes: "No onions", items: [{ id: "item", name: "Former pizza", imageUrl: null, sizeName: "Large", sizePriceCents: 400, quantity: 2, unitPriceCents: 1000, lineTotalCents: 2000, options: [{ id: "option", optionGroupName: "Extras", name: "Old cheese", priceDeltaCents: 250 }] }],
    subtotalCents: 2000, deliveryFeeCents: 500, serviceFeeCents: 120, totalCents: 2620,
    createdAt: "2026-01-02T01:00:00.000Z", updatedAt: "2026-01-02T02:00:00.000Z",
  });
  show(<CustomerOrderDetailPage orderId="order-id" />);
  expect(await screen.findByRole("heading", { name: "Order #12345" })).toBeInTheDocument();
  expect(screen.getByText(/2 × Former pizza/)).toBeInTheDocument();
  expect(screen.getByText(/Extras: Old cheese/)).toBeInTheDocument();
  expect(screen.getByText("7 Old Street")).toBeInTheDocument();
  expect(screen.getByText("No onions")).toBeInTheDocument();
  expect(screen.getByText("$26.20")).toBeInTheDocument();
});

test("detail 404 does not reveal another account's order", async () => {
  detail.mockRejectedValue(new ApiError(404, "Order not found."));
  show(<CustomerOrderDetailPage orderId="other-order" />);
  expect(await screen.findByRole("heading", { name: "Order not found" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
});
