"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  hydrateAdminSession,
  selectAuthError,
  selectAuthStatus,
} from "@/features/auth/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AdminRouteGuardProps = {
  children: ReactNode;
};

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const hasStartedRedirect = useRef(false);

  useEffect(() => {
    if (authStatus !== "unauthenticated" || hasStartedRedirect.current) {
      return;
    }

    hasStartedRedirect.current = true;

    const nextPath = pathname || "/admin/orders";

    router.replace(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }, [authStatus, pathname, router]);

  if (authStatus === "checking") {
    return <AdminRouteLoadingState />;
  }

  if (authStatus === "unauthenticated") {
    return <AdminRouteLoadingState label="Redirecting to sign in..." />;
  }

  if (authStatus === "error") {
    return (
      <AdminRouteErrorState
        message={authError ?? "Unable to verify your admin session."}
        onRetry={() => {
          void dispatch(hydrateAdminSession());
        }}
      />
    );
  }

  return <>{children}</>;
}

type AdminRouteLoadingStateProps = {
  label?: string;
};

function AdminRouteLoadingState({
  label = "Checking your admin session...",
}: AdminRouteLoadingStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-page-background)] px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-subtle)] border-t-[var(--color-brand)]" />

        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      </div>
    </main>
  );
}

type AdminRouteErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function AdminRouteErrorState({ message, onRetry }: AdminRouteErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <Card className="w-full max-w-md space-y-5 p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-lg text-[var(--color-brand-text-hover)]">
          !
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Session check failed
          </h1>

          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {message}
          </p>
        </div>

        <Button type="button" className="w-full" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    </main>
  );
}
