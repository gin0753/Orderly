"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { customerClient } from "../api/customer-api-fetch";
import { registerCustomerPrivateQueryClient } from "../lib/private-data";
import { subscribeCustomerSessionEvents, publishCustomerSessionEvent } from "../lib/session-events";
import { bootstrapCustomer, customerSessionChanged, customerSessionExpired } from "../store/customer-auth-slice";

export function CustomerAuthBootstrap() {
  const dispatch = useAppDispatch();
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const status = useAppSelector((state) => state.customerAuth.status);
  const knownCustomer = useRef(customer);
  const knownStatus = useRef(status);
  const queryClient = useQueryClient();
  useEffect(() => { knownCustomer.current = customer; knownStatus.current = status; }, [customer, status]);
  useEffect(() => registerCustomerPrivateQueryClient(queryClient), [queryClient]);
  useEffect(() => {
    const unsubscribe = customerClient.onSessionFailure(() => {
      if (knownCustomer.current) {
        dispatch(customerSessionExpired()); publishCustomerSessionEvent("ended");
      }
    });
    const unsubscribeEvents = subscribeCustomerSessionEvents((event) => {
      customerClient.invalidate();
      if (event === "ended") dispatch(customerSessionExpired());
      else { dispatch(customerSessionChanged()); void dispatch(bootstrapCustomer()); }
    });
    const completion = new URL(window.location.href);
    if (completion.searchParams.get("orderlyOAuth") === "complete") {
      completion.searchParams.delete("orderlyOAuth");
      window.history.replaceState(window.history.state, "", `${completion.pathname}${completion.search}${completion.hash}`);
      publishCustomerSessionEvent("changed");
    }
    function recheck() {
      // Known guests rely on explicit session-change broadcasts or a new mount.
      // Keep focus validation as a fallback where BroadcastChannel is unavailable.
      if (document.visibilityState === "visible" &&
        (knownStatus.current !== "unauthenticated" || !("BroadcastChannel" in window))) {
        void dispatch(bootstrapCustomer());
      }
    }
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    void dispatch(bootstrapCustomer());
    return () => { unsubscribe(); unsubscribeEvents(); window.removeEventListener("focus", recheck); document.removeEventListener("visibilitychange", recheck); };
  }, [dispatch]);
  return null;
}
