"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  clearAuthError,
  clearAuthNotice,
  loginAdmin,
  selectAuthError,
  selectAuthNotice,
  selectAuthStatus,
  selectIsLoggingIn,
} from "@/features/auth/store/auth-slice";
import { getSafeAdminNextPath } from "@/features/auth/lib/get-safe-admin-next-path";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);
  const authNotice = useAppSelector(selectAuthNotice);
  const isLoggingIn = useAppSelector(selectIsLoggingIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => getSafeAdminNextPath(searchParams.get("next")),
    [searchParams],
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace(nextPath);
    }
  }, [authStatus, nextPath, router]);

  function clearVisibleErrors() {
    setFormError(null);

    if (authError) {
      dispatch(clearAuthError());
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFormError("Enter your admin email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!password) {
      setFormError("Enter your password.");
      return;
    }

    setFormError(null);

    await dispatch(clearAuthNotice());

    await dispatch(
      loginAdmin({
        email: normalizedEmail,
        password,
      }),
    );
  }

  if (authStatus === "checking" || authStatus === "authenticated") {
    return (
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
        <div className="h-7 w-28 animate-pulse rounded bg-[var(--color-surface-disabled)]" />
        <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-disabled)]" />
        <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-disabled)]" />
        <div className="h-11 animate-pulse rounded-lg bg-[var(--color-surface-disabled)]" />
      </div>
    );
  }

  const visibleError = formError ?? authError;

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-brand-text)]">
            Admin access
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Sign in
          </h2>

          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Use your approved Orderly administrator account.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="admin-email"
            className="text-sm font-medium text-[var(--color-text-strong)]"
          >
            Email
          </label>

          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearVisibleErrors();
            }}
            placeholder="admin@orderly.local"
            disabled={isLoggingIn}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="admin-password"
            className="text-sm font-medium text-[var(--color-text-strong)]"
          >
            Password
          </label>

          <div className="relative">
            <Input
              id="admin-password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearVisibleErrors();
              }}
              className="pr-16"
              disabled={isLoggingIn}
            />

            <button
              type="button"
              className="absolute inset-y-0 right-3 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                setIsPasswordVisible((currentValue) => !currentValue);
              }}
              disabled={isLoggingIn}
            >
              {isPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {authNotice ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-[var(--color-notice-background)] px-3 py-2 text-sm font-medium text-[var(--color-notice-foreground)]"
          >
            {authNotice}
          </p>
        ) : null}

        {visibleError ? (
          <p
            role="alert"
            className="rounded-lg bg-[var(--color-danger-background)] px-3 py-2 text-sm font-medium text-[var(--color-danger-foreground)]"
          >
            {visibleError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
          Access is restricted to approved Orderly administrators.
        </p>
      </form>
    </Card>
  );
}
