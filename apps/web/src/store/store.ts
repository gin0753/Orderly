import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "@/features/cart/cart-slice";
import authReducer from "@/features/auth/store/auth-slice";
import customerAuthReducer from "@/features/customer-auth/store/customer-auth-slice";
import { clearCustomerPrivateData } from "@/features/customer-auth/lib/private-data";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
      customerAuth: customerAuthReducer,
    },
  });
  let previous = store.getState().customerAuth;
  store.subscribe(() => {
    const next = store.getState().customerAuth;
    if (previous.customer?.id !== next.customer?.id || (next.status === "unauthenticated" && previous.status !== next.status)) clearCustomerPrivateData();
    previous = next;
  });
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
