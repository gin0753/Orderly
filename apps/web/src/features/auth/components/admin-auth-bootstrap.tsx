"use client";

import { useEffect, useRef } from "react";

import {
  hydrateAdminSession,
  selectAuthInitialized,
  selectAuthStatus,
  sessionExpired,
} from "@/features/auth/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerAuthenticationFailureHandler } from "@/lib/api-fetch";

export function AdminAuthBootstrap() {
  const dispatch = useAppDispatch();

  const initialized = useAppSelector(selectAuthInitialized);
  const authStatus = useAppSelector(selectAuthStatus);

  const hasStartedHydration = useRef(false);
  const hasEstablishedSession = useRef(false);

  useEffect(() => {
    hasEstablishedSession.current = authStatus === "authenticated";
  }, [authStatus]);

  useEffect(() => {
    return registerAuthenticationFailureHandler(() => {
      if (hasEstablishedSession.current) {
        dispatch(sessionExpired());
      }
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
