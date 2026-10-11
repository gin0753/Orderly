/** @jest-environment jsdom */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderLookupForm } from "@/features/order-tracking/components/lookup/order-lookup-form";
import { OrderStatusTimeline } from "@/features/order-tracking/components/result/order-status-timeline";
import { lookupGuestOrder, OrderTrackingLookupError } from "@/features/order-tracking/api/order-tracking-api";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/features/order-tracking/api/order-tracking-api", () => ({
  ...jest.requireActual("@/features/order-tracking/api/order-tracking-api"), lookupGuestOrder: jest.fn(),
}));
const lookup = jest.mocked(lookupGuestOrder);
beforeEach(() => jest.clearAllMocks());

it("associates validation with the invalid field and focuses it on repeated submission", async () => {
  render(<OrderLookupForm />);
  const submit = screen.getByRole("button", { name: "Track Order" });
  await userEvent.click(submit);
  const number = screen.getByLabelText("Order number");
  await waitFor(() => expect(number).toHaveFocus());
  expect(number).toHaveAttribute("aria-invalid", "true");
  expect(number).toHaveAccessibleDescription("Please enter your order number.");
  await userEvent.click(submit);
  await waitFor(() => expect(number).toHaveFocus());
  await userEvent.type(number, "156001");
  await userEvent.click(submit);
  const contact = screen.getByLabelText("Email or phone");
  await waitFor(() => expect(contact).toHaveFocus());
  expect(contact).toHaveAccessibleDescription(/Use the same contact detail.*Please enter the email or phone/);
  expect(lookup).not.toHaveBeenCalled();
});

it("focuses safe server feedback, preserves entries and exposes pending lookup once", async () => {
  render(<OrderLookupForm />);
  await userEvent.type(screen.getByLabelText("Order number"), "156001");
  await userEvent.type(screen.getByLabelText("Email or phone"), "alex@example.test");
  let reject!: (error: Error) => void;
  lookup.mockReturnValue(new Promise((_, fail) => { reject = fail; }));
  await userEvent.click(screen.getByRole("button", { name: "Track Order" }));
  expect(screen.getByRole("button", { name: "Finding order..." })).toBeDisabled();
  expect(screen.getAllByRole("status")).toHaveLength(1);
  reject(new OrderTrackingLookupError("invalid-details"));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
  expect(screen.getByLabelText("Order number")).toHaveValue("156001");
  expect(screen.getByLabelText("Email or phone")).toHaveValue("alex@example.test");
});

it.each(["PENDING", "ACCEPTED", "PREPARING", "READY", "COMPLETED"] as const)("uses ordered steps and truthful current semantics for %s", (status) => {
  render(<OrderStatusTimeline status={status} orderType="PICKUP" createdAt="2026-10-09T03:00:00Z" updatedAt="2026-10-09T03:10:00Z" />);
  const list = screen.getByRole("list", { name: "Order progress" });
  const steps = within(list).getAllByRole("listitem");
  expect(steps).toHaveLength(4);
  expect(list.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  expect(list).toHaveTextContent(status === "ACCEPTED" ? "Accepted" : "Current status");
  if (status !== "COMPLETED") expect(list).toHaveTextContent("Not yet reached");
});

it("does not imply normal progress for cancellation", () => {
  render(<OrderStatusTimeline status="CANCELLED" orderType="DELIVERY" createdAt="2026-10-09T03:00:00Z" updatedAt="2026-10-09T03:10:00Z" />);
  expect(screen.getByRole("heading", { name: "This order has been cancelled" })).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});
