"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { logoutCustomer } from "../store/customer-auth-slice";

export function CustomerSignOut() {
  const dispatch = useAppDispatch();
  const { operation, error } = useAppSelector((state) => state.customerAuth);
  return <div className="max-w-56">
    <Button variant="ghost" className="min-h-11" disabled={operation !== null} onClick={() => { void dispatch(logoutCustomer()); }}>
      {operation === "logout" ? "Signing out…" : "Sign out"}
    </Button>
    {error ? <p role="alert" className="text-xs text-[var(--color-danger-strong)]">{error}</p> : null}
  </div>;
}
