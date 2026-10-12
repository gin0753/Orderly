"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { bootstrapCustomer } from "../store/customer-auth-slice";
import { safeCustomerReturnPath } from "../lib/return-path";

export function CustomerRouteGuard({ children }: { children: ReactNode }) {
  const { status, error, accountDeleted } = useAppSelector((state) => state.customerAuth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (status === "unauthenticated") {
      if (accountDeleted) { router.replace("/"); return; }
      const destination = safeCustomerReturnPath(`${pathname}${window.location.search}`);
      router.replace(`/login?returnTo=${encodeURIComponent(destination)}`);
    }
  }, [status, pathname, router, accountDeleted]);
  if (status === "authenticated") return children;
  return <div className="mx-auto max-w-md px-4 py-10 text-center">
    {status === "error" ? <div role="alert" className="space-y-4"><h1 className="text-xl font-bold">Unable to check your session</h1><p>{error}</p><Button onClick={() => { void dispatch(bootstrapCustomer()); }}>Try again</Button></div>
      : <p role="status">{status === "unauthenticated" ? accountDeleted ? "Returning to the storefront…" : "Taking you to sign in…" : "Checking your session…"}</p>}
  </div>;
}
