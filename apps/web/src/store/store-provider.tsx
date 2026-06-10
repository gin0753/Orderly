"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";

import { hydrateCart, selectCartItems } from "@/features/cart/cart-slice";
import {
  readCartFromStorage,
  writeCartToStorage,
} from "@/features/cart/cart-storage";

import { makeStore } from "./store";

type StoreProviderProps = {
  children: ReactNode;
};

export function StoreProvider({ children }: StoreProviderProps) {
  const [store] = useState(() => makeStore());

  useEffect(() => {
    const persistedCart = readCartFromStorage();

    store.dispatch(hydrateCart(persistedCart));

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();

      writeCartToStorage({
        items: selectCartItems(state),
      });
    });

    return unsubscribe;
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
