"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
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
  const lastPersistedCartRef = useRef<string>("");

  useEffect(() => {
    const persistedCart = readCartFromStorage();

    store.dispatch(hydrateCart(persistedCart));

    lastPersistedCartRef.current = JSON.stringify({
      items: persistedCart.items,
    });

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();

      const nextPersistedCart = {
        items: selectCartItems(state),
      };

      const serializedCart = JSON.stringify(nextPersistedCart);

      if (serializedCart === lastPersistedCartRef.current) {
        return;
      }

      writeCartToStorage(nextPersistedCart);
      lastPersistedCartRef.current = serializedCart;
    });

    return unsubscribe;
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
