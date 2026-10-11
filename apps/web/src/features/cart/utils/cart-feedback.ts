import type { Middleware } from "@reduxjs/toolkit";

import { addItem, clearCart, removeItem, updateQuantity } from "../cart-slice";
import type { CartState } from "../cart-types";

export const CART_FEEDBACK_EVENT = "orderly:cart-feedback";
export type CartFeedback = { kind: "add" | "edit"; message: string };

/** Presentation only: no change to cart state, persistence or action contracts. */
export const cartFeedbackMiddleware: Middleware<object, { cart: CartState }> =
  (store) => (next) => (action) => {
    const before = store.getState().cart;
    const result = next(action);
    if (typeof window === "undefined") return result;
    const after = store.getState().cart;
    let feedback: CartFeedback | undefined;
    if (addItem.match(action)) {
      const item = after.items.find((entry) => entry.key === action.payload.key);
      if (item) feedback = { kind: "add", message: `Added ${action.payload.quantity} × ${item.product.name}. ${item.quantity} in cart.` };
    } else if (updateQuantity.match(action) || removeItem.match(action)) {
      const previous = before.items.find((entry) => entry.key === action.payload.key);
      const item = after.items.find((entry) => entry.key === action.payload.key);
      if (previous && previous.quantity !== item?.quantity) {
        feedback = { kind: "edit", message: item
          ? `${item.product.name}: quantity ${item.quantity}.`
          : `Removed ${previous.product.name} from your cart.` };
      }
    } else if (clearCart.match(action) && before.items.length > 0) {
      feedback = { kind: "edit", message: "Cart cleared." };
    }
    if (feedback) window.dispatchEvent(new CustomEvent<CartFeedback>(CART_FEEDBACK_EVENT, { detail: feedback }));
    return result;
  };
