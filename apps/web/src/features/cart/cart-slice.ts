import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "@/store/store";

import { CartItem, CartState } from "./cart-types";
import { getCartItemCount, getCartSubtotalCents } from "./cart-utils";

const initialState: CartState = {
  items: [],
  isCartOpen: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(state, action: PayloadAction<{ items: CartItem[] }>) {
      state.items = action.payload.items;
    },

    addItem(state, action: PayloadAction<CartItem>) {
      const existingItem = state.items.find(
        (item) => item.key === action.payload.key,
      );

      if (!existingItem) {
        state.items.push(action.payload);
        return;
      }

      existingItem.quantity += action.payload.quantity;
    },

    updateQuantity(
      state,
      action: PayloadAction<{
        key: string;
        quantity: number;
      }>,
    ) {
      const { key, quantity } = action.payload;

      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.key !== key);
        return;
      }

      const item = state.items.find((cartItem) => cartItem.key === key);

      if (!item) {
        return;
      }

      item.quantity = quantity;
    },

    removeItem(
      state,
      action: PayloadAction<{
        key: string;
      }>,
    ) {
      state.items = state.items.filter(
        (item) => item.key !== action.payload.key,
      );
    },

    clearCart(state) {
      state.items = [];
    },

    openCart(state) {
      state.isCartOpen = true;
    },

    closeCart(state) {
      state.isCartOpen = false;
    },

    toggleCart(state) {
      state.isCartOpen = !state.isCartOpen;
    },
  },
});

export const {
  hydrateCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
} = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectIsCartOpen = (state: RootState) => state.cart.isCartOpen;

export const selectCartItemCount = (state: RootState) =>
  getCartItemCount(state.cart.items);

export const selectCartSubtotalCents = (state: RootState) =>
  getCartSubtotalCents(state.cart.items);

export const selectIsCartEmpty = (state: RootState) =>
  state.cart.items.length === 0;

export default cartSlice.reducer;
