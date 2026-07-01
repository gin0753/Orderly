"use client";

import { useEffect, useRef } from "react";

import {
  hydrateAdminSession,
  sessionExpired,
  selectAuthInitialized,
} from "@/features/auth/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerAuthenticationFailureHandler } from "@/lib/api-fetch";

export function AdminAuthBootstrap() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);
  const hasStartedHydration = useRef(false);

  useEffect(() => {
    return registerAuthenticationFailureHandler(() => {
      dispatch(sessionExpired());
    });
  }, [dispatch]);

  useEffect(() => {
    if (initialized || hasStartedHydration.current) {
      return;
    }

    hasStartedHydration.current = true;

    void dispatch(hydrateAdminSession());
  }, [dispatch, initialized]);

  return null;
}
