import type {
  CartItem,
  CartProductSnapshot,
  CartSelectedOption,
} from "./cart-types";

const CART_STORAGE_KEY = "orderly.cart.v2";
const LEGACY_CART_STORAGE_KEY = "orderly.cart.v1";

type PersistedCartState = {
  items: CartItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCartProductSnapshot(value: unknown): value is CartProductSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.priceCents === "number" &&
    Number.isInteger(value.priceCents) &&
    value.priceCents >= 0 &&
    (value.description === undefined ||
      value.description === null ||
      typeof value.description === "string") &&
    (value.imageUrl === undefined ||
      value.imageUrl === null ||
      typeof value.imageUrl === "string")
  );
}

function isCartSelectedOption(value: unknown): value is CartSelectedOption {
  if (!isRecord(value)) {
    return false;
  }

  const validKinds = ["SIZE", "MODIFIER", "ADD_ON"];

  return (
    typeof value.id === "string" &&
    typeof value.optionGroupId === "string" &&
    typeof value.optionGroupName === "string" &&
    typeof value.kind === "string" &&
    validKinds.includes(value.kind) &&
    typeof value.name === "string" &&
    typeof value.priceDeltaCents === "number" &&
    Number.isInteger(value.priceDeltaCents)
  );
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.key === "string" &&
    isCartProductSnapshot(value.product) &&
    Array.isArray(value.selectedOptions) &&
    value.selectedOptions.every(isCartSelectedOption) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof value.unitPriceCents === "number" &&
    Number.isInteger(value.unitPriceCents) &&
    value.unitPriceCents >= 0
  );
}

function clearLegacyCart() {
  window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
}

export function readCartFromStorage(): PersistedCartState {
  if (typeof window === "undefined") {
    return {
      items: [],
    };
  }

  try {
    clearLegacyCart();

    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawValue) {
      return {
        items: [],
      };
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (
      !isRecord(parsedValue) ||
      !Array.isArray(parsedValue.items) ||
      !parsedValue.items.every(isCartItem)
    ) {
      window.localStorage.removeItem(CART_STORAGE_KEY);

      return {
        items: [],
      };
    }

    return {
      items: parsedValue.items,
    };
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);

    return {
      items: [],
    };
  }
}

export function writeCartToStorage(state: PersistedCartState) {
  if (typeof window === "undefined") {
    return;
  }

  clearLegacyCart();

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
}
