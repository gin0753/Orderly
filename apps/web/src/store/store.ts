import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "@/features/cart/cart-slice";
import authReducer from "@/features/auth/store/auth-slice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
