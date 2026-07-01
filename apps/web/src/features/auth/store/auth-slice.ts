import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

import { authApi } from "../api/auth-api";
import type { AdminLoginInput, AdminUser, AuthSessionStatus } from "../types";
import { ApiError } from "@/lib/api-fetch";

type AuthFailure = {
  message: string;
  status?: number;
};

type AuthState = {
  user: AdminUser | null;
  status: AuthSessionStatus;
  initialized: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  status: "checking",
  initialized: false,
  isLoggingIn: false,
  isLoggingOut: false,
  error: null,
};

function toAuthFailure(error: unknown, fallbackMessage: string): AuthFailure {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  return {
    message: fallbackMessage,
  };
}

export const hydrateAdminSession = createAsyncThunk<
  AdminUser,
  void,
  { rejectValue: AuthFailure }
>("auth/hydrateAdminSession", async (_, thunkApi) => {
  try {
    const response = await authApi.getCurrentAdmin();

    return response.user;
  } catch (error) {
    return thunkApi.rejectWithValue(
      toAuthFailure(error, "Unable to verify the current admin session."),
    );
  }
});

export const loginAdmin = createAsyncThunk<
  AdminUser,
  AdminLoginInput,
  { rejectValue: AuthFailure }
>("auth/loginAdmin", async (input, thunkApi) => {
  try {
    const response = await authApi.login(input);

    return response.user;
  } catch (error) {
    return thunkApi.rejectWithValue(
      toAuthFailure(error, "Unable to sign in. Please try again."),
    );
  }
});

export const logoutAdmin = createAsyncThunk<
  void,
  void,
  { rejectValue: AuthFailure }
>("auth/logoutAdmin", async (_, thunkApi) => {
  try {
    await authApi.logout();
  } catch (error) {
    return thunkApi.rejectWithValue(
      toAuthFailure(error, "Unable to sign out. Please try again."),
    );
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },

    sessionExpired(state) {
      state.user = null;
      state.status = "unauthenticated";
      state.initialized = true;
      state.error = null;
      state.isLoggingIn = false;
      state.isLoggingOut = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAdminSession.pending, (state) => {
        state.status = "checking";
        state.error = null;
      })
      .addCase(hydrateAdminSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.initialized = true;
        state.error = null;
      })
      .addCase(hydrateAdminSession.rejected, (state, action) => {
        const failure = action.payload;

        state.user = null;
        state.initialized = true;

        if (failure?.status === 401 || failure?.status === 403) {
          state.status = "unauthenticated";
          state.error = null;
          return;
        }

        state.status = "error";
        state.error =
          failure?.message ?? "Unable to verify the current admin session.";
      })
      .addCase(loginAdmin.pending, (state) => {
        state.isLoggingIn = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.initialized = true;
        state.isLoggingIn = false;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.user = null;
        state.status = "unauthenticated";
        state.initialized = true;
        state.isLoggingIn = false;
        state.error =
          action.payload?.message ?? "Unable to sign in. Please try again.";
      })
      .addCase(logoutAdmin.pending, (state) => {
        state.isLoggingOut = true;
        state.error = null;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.initialized = true;
        state.isLoggingOut = false;
        state.error = null;
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.isLoggingOut = false;
        state.error =
          action.payload?.message ?? "Unable to sign out. Please try again.";
      });
  },
});

export const { clearAuthError, sessionExpired } = authSlice.actions;

export const selectAuthUser = (state: RootState) => state.auth.user;

export const selectAuthStatus = (state: RootState) => state.auth.status;

export const selectAuthInitialized = (state: RootState) =>
  state.auth.initialized;

export const selectAuthError = (state: RootState) => state.auth.error;

export const selectIsLoggingIn = (state: RootState) => state.auth.isLoggingIn;

export const selectIsLoggingOut = (state: RootState) => state.auth.isLoggingOut;

export default authSlice.reducer;
