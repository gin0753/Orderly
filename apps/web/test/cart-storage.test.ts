/** @jest-environment jsdom */

import { readCartFromStorage } from "@/features/cart/cart-storage";

describe("persisted cart sanitation", () => {
  beforeEach(() => {
    localStorage.clear();
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
