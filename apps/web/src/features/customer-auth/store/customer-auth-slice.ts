import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ApiError } from "@/lib/api-fetch";
import type { RootState } from "@/store/store";
import { customerAuthApi } from "../api/customer-auth-api";
import { customerClient } from "../api/customer-api-fetch";
import { publishCustomerSessionEvent } from "../lib/session-events";
import type {
  CustomerLoginInput,
  CustomerRegisterInput,
  RegistrationResult,
  PublicCustomer,
} from "../types";

type Failure = { status?: number; message: string };
type CustomerAuthState = {
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  customer: PublicCustomer | null;
  requestId: string | null;
  operation: "bootstrap" | "login" | "register" | "logout" | null;
  error: string | null;
  notice: string | null;
  accountDeleted: boolean;
};
const initialState: CustomerAuthState = {
  status: "idle",
  customer: null,
  requestId: null,
  operation: null,
  error: null,
  notice: null,
  accountDeleted: false,
};
function failure(error: unknown): Failure {
  return {
    status: error instanceof ApiError ? error.status : undefined,
    message:
      error instanceof ApiError && error.status < 500
        ? error.message
        : "We couldn’t reach your account. Please try again.",
  };
}

export const bootstrapCustomer = createAsyncThunk<
  PublicCustomer,
  void,
  { state: RootState; rejectValue: Failure }
>(
  "customerAuth/bootstrap",
  async (_, api) => {
    try {
      return (await customerAuthApi.me()).user;
    } catch (error) {
      return api.rejectWithValue(failure(error));
    }
  },
  { condition: (_, api) => !api.getState().customerAuth.operation },
);

export const loginCustomer = createAsyncThunk<
  PublicCustomer,
  CustomerLoginInput,
  { rejectValue: Failure }
>("customerAuth/login", async (input, api) => {
  try {
    const result = await customerAuthApi.login(input);
    customerClient.invalidate();
    publishCustomerSessionEvent("changed");
    return result.user;
  } catch (error) {
    return api.rejectWithValue(failure(error));
  }
});
export const registerCustomer = createAsyncThunk<
  RegistrationResult,
  CustomerRegisterInput,
  { rejectValue: Failure }
>("customerAuth/register", async (input, api) => {
  try {
    const result = await customerAuthApi.register(input);
    if ("user" in result) {
      customerClient.invalidate();
      publishCustomerSessionEvent("changed");
    }
    return result;
  } catch (error) {
    return api.rejectWithValue(failure(error));
  }
});
export const logoutCustomer = createAsyncThunk<
  void,
  void,
  { rejectValue: Failure }
>("customerAuth/logout", async (_, api) => {
  try {
    await customerAuthApi.logout();
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401))
      return api.rejectWithValue(failure(error));
  }
  customerClient.invalidate();
  publishCustomerSessionEvent("ended");
});

const slice = createSlice({
  name: "customerAuth",
  initialState,
  reducers: {
    customerProfileUpdated(state, action: { payload: PublicCustomer }) {
      if (
        state.status === "authenticated" &&
        state.customer?.id === action.payload.id
      )
        state.customer = action.payload;
    },
    customerSessionReplaced(state, action: { payload: PublicCustomer }) {
      state.customer = action.payload;
      state.accountDeleted = false;
      state.status = "authenticated";
      state.operation = null;
      state.requestId = null;
      state.error = null;
      state.notice = null;
    },
    customerAccountDeleted(state) {
      Object.assign(state, {
        ...initialState,
        status: "unauthenticated",
        notice: "Your customer account has been deleted.",
        accountDeleted: true,
      });
    },
    customerSessionExpired(state) {
      Object.assign(state, {
        status: "unauthenticated",
        customer: null,
        requestId: null,
        operation: null,
        error: null,
        notice: "Your session expired. Sign in again to continue.",
      });
    },
    customerSessionChanged(state) {
      Object.assign(state, initialState);
    },
    clearCustomerFeedback(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    for (const thunk of [
      bootstrapCustomer,
      loginCustomer,
      registerCustomer,
      logoutCustomer,
    ]) {
      builder.addCase(thunk.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.operation =
          thunk === bootstrapCustomer
            ? "bootstrap"
            : thunk === loginCustomer
              ? "login"
              : thunk === registerCustomer
                ? "register"
                : "logout";
        if (thunk === bootstrapCustomer) state.status = "loading";
        state.error = null;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.operation = null;
        state.requestId = null;
        if (thunk === bootstrapCustomer && action.payload?.status === 401) {
          state.status = "unauthenticated";
          state.customer = null;
          state.error = null;
        } else {
          if (thunk === bootstrapCustomer) state.status = "error";
          state.error =
            thunk === loginCustomer && action.payload?.status === 401
              ? "Invalid email or password."
              : (action.payload?.message ??
                "We couldn’t reach your account. Please try again.");
        }
      });
    }
    for (const thunk of [bootstrapCustomer, loginCustomer]) {
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.customer = action.payload;
        state.accountDeleted = false;
        state.status = "authenticated";
        state.operation = null;
        state.requestId = null;
        state.error = null;
        state.notice = null;
      });
    }
    builder.addCase(registerCustomer.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
      state.operation = null;
      state.requestId = null;
      state.error = null;
      if ("user" in action.payload) {
        state.customer = action.payload.user;
        state.status = "authenticated";
        state.accountDeleted = false;
        state.notice = null;
        return;
      }
      state.notice =
        action.payload.status === "delivery_failed"
          ? "Verification email delivery failed. Please try again."
          : "Check your email to finish registration.";
    });
    builder.addCase(logoutCustomer.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
      Object.assign(state, { ...initialState, status: "unauthenticated" });
    });
  },
});
export const {
  customerAccountDeleted,
  customerSessionExpired,
  customerSessionChanged,
  customerProfileUpdated,
  customerSessionReplaced,
  clearCustomerFeedback,
} = slice.actions;
export default slice.reducer;
