/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptCodePanel } from "@/features/order-tracking/components/receipt-code-panel";
import { clearTrackingLookup, getTrackingLookup, saveTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";

const code = "a".repeat(43);
const receipt = () => ({ orderNumber: "10001", receiptCode: code, expiresAt: new Date(Date.now() + 86400000).toISOString() });
beforeEach(() => { clearTrackingLookup(); window.sessionStorage.clear(); });
afterEach(() => { jest.restoreAllMocks(); clearTrackingLookup(); });

it("stores only the tab receipt and never uses local storage or contact information", () => {
  saveTrackingLookup(receipt());
  const stored = JSON.parse(window.sessionStorage.getItem("orderly:tracking-lookup")!) as object;
  expect(Object.keys(stored).sort()).toEqual(["expiresAt", "orderNumber", "receiptCode"]);
  expect(getTrackingLookup()?.receiptCode === code).toBe(true);
  expect(window.localStorage.getItem("orderly:tracking-lookup")).toBeNull();
});
it("rejects old contact-only storage, malformed and expired receipts", () => {
  for (const value of [{ orderNumber: "10001", email: "synthetic@example.test" }, { ...receipt(), receiptCode: "bad" }, { ...receipt(), expiresAt: new Date(0).toISOString() }]) {
    window.sessionStorage.setItem("orderly:tracking-lookup", JSON.stringify(value));
    expect(getTrackingLookup()).toBeNull();
    expect(window.sessionStorage.getItem("orderly:tracking-lookup")).toBeNull();
  }
});
it("restores a valid tab receipt after a module/session reload", () => {
  window.sessionStorage.setItem("orderly:tracking-lookup", JSON.stringify(receipt()));
  expect(getTrackingLookup()?.receiptCode === code).toBe(true);
});
it("keeps confirmation usable with blocked storage and unavailable clipboard", async () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
  saveTrackingLookup(receipt());
  render(<ReceiptCodePanel orderNumber="10001" />);
  await waitFor(() => expect(screen.getByLabelText("Receipt code")).toBeVisible());
  expect((screen.getByLabelText("Receipt code") as HTMLTextAreaElement).value === code).toBe(true);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  await userEvent.click(screen.getByRole("button", { name: "Copy receipt code" }));
  expect(screen.getByRole("status")).toHaveTextContent("Select the receipt code");
  await userEvent.click(screen.getByRole("button", { name: "Forget on this tab" }));
  expect(getTrackingLookup()).toBeNull();
});
it("copies a receipt only on explicit user action", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  saveTrackingLookup(receipt());
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<ReceiptCodePanel orderNumber="10001" />);
  await screen.findByLabelText("Receipt code");
  expect(writeText).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Copy receipt code" }));
  expect(writeText.mock.calls.length).toBe(1);
  expect(writeText.mock.calls[0][0] === code).toBe(true);
  expect(screen.getByRole("status")).toHaveTextContent("Receipt code copied");
});
