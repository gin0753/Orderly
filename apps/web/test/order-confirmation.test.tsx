/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import OrderSuccessPage from "@/app/(customer)/order-success/page";

it.each(["PICKUP", "DELIVERY"])("shows only the supplied %s confirmation and tracking destination", async (orderType) => {
  render(await OrderSuccessPage({ searchParams: Promise.resolve({ orderNumber: "10001", orderType, totalCents: "2120" }) }));
  expect(screen.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  expect(screen.getByText("#10001")).toBeVisible();
  expect(screen.getByText(orderType === "PICKUP" ? "Pickup" : "Delivery", { exact: true })).toBeVisible();
  expect(screen.getByText("$21.20")).toBeVisible();
  expect(screen.getByRole("link", { name: "Track your order" })).toHaveAttribute("href", "/track-order/10001");
  expect(screen.getByRole("link", { name: "Start another order" })).toHaveAttribute("href", "/");
  expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  expect(screen.queryByText(/paid|arrives|accepted/i)).not.toBeInTheDocument();
});

it.each([{}, { orderNumber: "10001", orderType: "PICKUP", totalCents: "NaN" }, { orderNumber: "10001", orderType: "OTHER", totalCents: "2120" }])("recovers missing/invalid confirmation details", async (params) => {
  render(await OrderSuccessPage({ searchParams: Promise.resolve(params) }));
  expect(screen.getByRole("heading", { name: "Order details unavailable" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Track order" })).toHaveAttribute("href", "/track-order");
  expect(screen.getByRole("link", { name: "Browse menu" })).toHaveAttribute("href", "/");
});
