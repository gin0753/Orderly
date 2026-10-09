/** @jest-environment jsdom */

import {
  readCartFromStorage,
  writeCartToStorage,
} from "@/features/cart/cart-storage";

describe("persisted cart sanitation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => jest.restoreAllMocks());

  it("keeps cart hydration usable when browser storage is blocked", () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    expect(readCartFromStorage()).toEqual({ items: [] });
    expect(() => writeCartToStorage({ items: [] })).not.toThrow();
  });

  it("does not interrupt cart updates when persistence quota is exhausted", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    expect(() => writeCartToStorage({ items: [] })).not.toThrow();
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["an invalid item", JSON.stringify({ items: [{ quantity: -1 }] })],
  ])("discards %s rather than hydrating corrupt state", (_caseName, value) => {
    localStorage.setItem("orderly.cart.v2", value);

    expect(readCartFromStorage()).toEqual({ items: [] });
    expect(localStorage.getItem("orderly.cart.v2")).toBeNull();
  });
});
