/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import {
  INVALID_TRACKING_DETAILS_MESSAGE,
  lookupGuestOrder,
  TRACKING_UNAVAILABLE_MESSAGE,
} from "@/features/order-tracking/api/order-tracking-api";
import { OrderTrackingErrorState } from "@/features/order-tracking/components/result/order-tracking-error-state";

const pushMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  Object.defineProperty(global, "fetch", {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
});

afterEach(() => {
  fetchMock.mockReset();
});

it.each([
  [404, "invalid-details", INVALID_TRACKING_DETAILS_MESSAGE],
  [500, "unavailable", TRACKING_UNAVAILABLE_MESSAGE],
] as const)(
  "maps tracking response %i to safe %s copy without exposing the response body",
  async (status, kind, expectedMessage) => {
    fetchMock.mockResolvedValue({ ok: false, status });

    await expect(
      lookupGuestOrder({
        orderNumber: "123",
        email: "customer@example.com",
      }),
    ).rejects.toMatchObject({
      kind,
      message: expectedMessage,
    });
  },
);

it("announces tracking errors, focuses the heading and preserves the encoded order number", () => {
  render(
    <OrderTrackingErrorState
      orderNumber="ORD-123&next=/admin"
      errorKind="invalid-details"
      message={INVALID_TRACKING_DETAILS_MESSAGE}
      onRetry={jest.fn()}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    INVALID_TRACKING_DETAILS_MESSAGE,
  );
  expect(screen.getByRole("heading", { name: "Order not found" })).toHaveFocus();
  screen.getByRole("button", { name: "Re-enter details" }).click();
  expect(pushMock).toHaveBeenCalledWith(
    "/track-order?orderNumber=ORD-123%26next%3D%2Fadmin",
  );
  expect(document.body).not.toHaveTextContent(/contact|real[- ]time|20–30|30–45/i);
});
