/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useOrderTracking } from "@/features/order-tracking/hooks/use-order-tracking";
import { lookupGuestOrder, OrderTrackingLookupError } from "@/features/order-tracking/api/order-tracking-api";
import { clearTrackingLookup, saveTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";

jest.mock("@/features/order-tracking/api/order-tracking-api", () => ({
  ...jest.requireActual("@/features/order-tracking/api/order-tracking-api"), lookupGuestOrder: jest.fn(),
}));
const lookup = jest.mocked(lookupGuestOrder);
beforeEach(() => { lookup.mockReset(); clearTrackingLookup(); });
afterEach(() => clearTrackingLookup());

it("keeps invalid/revoked proof on explicit retries instead of switching to owner access", async () => {
  const code = "a".repeat(43);
  saveTrackingLookup({ orderNumber: "10001", receiptCode: code });
  lookup.mockRejectedValue(new OrderTrackingLookupError("invalid-details"));
  const { result } = renderHook(() => useOrderTracking("10001"));
  await waitFor(() => expect(result.current.error?.kind).toBe("invalid-details"));
  act(() => result.current.refreshOrder());
  await waitFor(() => expect(lookup.mock.calls.length).toBe(2));
  expect(lookup.mock.calls.every(([payload]) => payload.receiptCode === code)).toBe(true);
  expect(result.current.order).toBeNull();
  expect(result.current.needsVerification).toBe(false);
});
