import { CartItem } from "./cart-types";

const CART_STORAGE_KEY = "orderly.cart.v1";

type PersistedCartState = {
  items: CartItem[];
};

export function readCartFromStorage(): PersistedCartState {
  if (typeof window === "undefined") {
    return {
      items: [],
    };
  }

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawValue) {
      return {
        items: [],
      };
    }

    const parsedValue = JSON.parse(rawValue) as PersistedCartState;

    if (!Array.isArray(parsedValue.items)) {
      return {
        items: [],
      };
    }

    return {
      items: parsedValue.items,
    };
  } catch {
    return {
      items: [],
    };
  }
}

export function writeCartToStorage(state: PersistedCartState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
}
