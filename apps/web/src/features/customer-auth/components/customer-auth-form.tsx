"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GoogleAuthButton } from "./google-brand";
import { safeCustomerReturnPath } from "../lib/return-path";
import { customerAuthApi } from "../api/customer-auth-api";
import { navigateToGoogle } from "../lib/google-navigation";
import { customerAuthFormErrors, type AuthFormErrors, type AuthFormValues } from "../lib/validation";
import { bootstrapCustomer, clearCustomerFeedback, loginCustomer, registerCustomer } from "../store/customer-auth-slice";

export function CustomerAuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.customerAuth);
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = safeCustomerReturnPath(search.get("returnTo"));
  const [values, setValues] = useState<AuthFormValues>({ name: "", email: "", password: "", confirmation: "" });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const googleErrorRef = useRef<HTMLParagraphElement>(null);
  const busy = auth.operation === "login" || auth.operation === "register";
  const unresolved = auth.status === "idle" || auth.status === "loading";

  useEffect(() => { dispatch(clearCustomerFeedback()); }, [dispatch, mode]);
  useEffect(() => {
    let live = true;
    void customerAuthApi.googleStatus().then((result) => { if (live) setGoogleAvailable(result.enabled); }).catch(() => { if (live) setGoogleError("Google sign-in is temporarily unavailable."); });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (auth.status === "authenticated") router.replace(returnTo); }, [auth.status, returnTo, router]);
  useEffect(() => {
    if (auth.error && !auth.operation) {
      errorRef.current?.focus();
      errorRef.current?.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  }, [auth.error, auth.operation]);
  useEffect(() => {
    if (googleError === "Google sign-in could not start. Please try again.") {
      googleErrorRef.current?.focus();
      googleErrorRef.current?.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  }, [googleError]);

  function change(field: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (auth.error) dispatch(clearCustomerFeedback());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || unresolved) return;
    const nextErrors = customerAuthFormErrors(values, registering);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        const target = formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]');
        target?.focus();
        target?.scrollIntoView?.({ block: "center", behavior: "instant" });
      });
      return;
    }
    const credentials = { email: values.email.trim().toLowerCase(), password: values.password };
    if (registering) await dispatch(registerCustomer({ ...credentials, name: values.name.trim() }));
    else await dispatch(loginCustomer(credentials));
  }

  async function startGoogle() {
    if (googleBusy || unresolved || auth.status === "authenticated") return;
    setGoogleBusy(true); setGoogleError(null);
    try {
      const result = await customerAuthApi.googleStart(returnTo);
      navigateToGoogle(result.authorizationUrl);
    } catch {
      setGoogleError("Google sign-in could not start. Please try again.");
      setGoogleBusy(false);
    }
  }

  function field(key: keyof AuthFormValues, label: string, autocomplete: string, type = "text") {
    return <div className="space-y-1.5">
      <label htmlFor={`customer-${key}`} className="text-sm font-semibold">{label}</label>
      <Input id={`customer-${key}`} name={key} type={type} autoComplete={autocomplete} value={values[key]}
        onChange={(event) => change(key, event.target.value)} aria-invalid={Boolean(errors[key])}
        aria-describedby={[key === "password" && registering ? "customer-password-help" : "", errors[key] ? `customer-${key}-error` : ""].filter(Boolean).join(" ") || undefined}
        disabled={busy} className="w-full" required />
      {errors[key] ? <p id={`customer-${key}-error`} className="text-sm text-[var(--color-danger-strong)]">{errors[key]}</p> : null}
    </div>;
  }

  return <section aria-labelledby="auth-heading" className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
    <header className="mb-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand-text)]">Your Orderly account</p>
      <h1 id="auth-heading" className="text-[length:var(--text-page-title)] font-bold leading-[var(--leading-page-title)] tracking-tight">{registering ? "Create your account" : "Sign in to Orderly"}</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{registering ? "Keep your profile and signed-in orders in one place." : "Welcome back. Sign in to view your account and orders."}</p>
    </header>
    <Card variant="surface" className="space-y-5 p-5 sm:p-8">
      {auth.notice ? <p role="status" className="mt-4 text-sm">{auth.notice}</p> : null}
      {search.get("google") === "conflict" ? <p role="alert" className="mt-4 rounded-xl bg-[var(--color-danger-background)] p-3 text-sm">An Orderly account already uses this email. Sign in with your password, then connect Google from your account.</p> : null}
      {search.get("google") === "failed" || search.get("google") === "cancelled" ? <p role="alert" className="mt-4 rounded-xl bg-[var(--color-danger-background)] p-3 text-sm">Google sign-in did not complete. Please try again.</p> : null}
      {unresolved ? <p role="status" className="mt-4 text-sm">Checking your session…</p> : null}
      {auth.status === "error" ? <div className="mt-4 space-y-2 text-sm"><p>We couldn’t check your existing session. You can try again or sign in below.</p><Button variant="secondary" onClick={() => { void dispatch(bootstrapCustomer()); }}>Check session again</Button></div> : null}
      <form ref={formRef} onSubmit={submit} noValidate aria-label={registering ? "Create your account" : "Sign in"} aria-busy={busy} className="space-y-5">
        {registering ? field("name", "Name", "name") : null}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", registering ? "new-password" : "current-password", showPassword ? "text" : "password")}
        {registering ? <p id="customer-password-help" className="text-xs leading-5 text-[var(--color-text-secondary)]">At least 15 characters, up to 72 UTF-8 bytes. Spaces are kept.</p> : null}
        {registering ? field("confirmation", "Confirm password", "new-password", showPassword ? "text" : "password") : null}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} disabled={busy} className="size-5 accent-[var(--color-brand-strong)]" />Show password</label>
        {auth.error ? <p ref={errorRef} role="alert" tabIndex={-1} className="rounded-xl bg-[var(--color-danger-background)] p-3 text-sm text-[var(--color-danger-strong)]">{auth.error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy || unresolved || auth.status === "authenticated"}>
          {busy ? (registering ? "Creating account…" : "Signing in…") : (registering ? "Create account" : "Sign in")}
        </Button>
        {busy ? <span role="status" className="sr-only">{registering ? "Creating your account" : "Signing you in"}</span> : null}
      </form>
      {googleAvailable ? <div className="mt-6">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]" aria-hidden="true"><span className="h-px flex-1 bg-[var(--color-border)]" />or<span className="h-px flex-1 bg-[var(--color-border)]" /></div>
        <GoogleAuthButton busy={googleBusy} disabled={googleBusy || busy || unresolved || auth.status === "authenticated"} onClick={() => { void startGoogle(); }} />
      </div> : null}
      {googleError ? <p ref={googleErrorRef} tabIndex={-1} role="alert" className="mt-3 rounded-xl bg-[var(--color-danger-background)] p-3 text-sm text-[var(--color-danger-strong)]">{googleError}</p> : null}
      <p className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-sm">{registering ? "Already have an account? " : "New to Orderly? "}<Link className="inline-flex min-h-11 items-center font-semibold text-[var(--color-brand-text)] underline underline-offset-4" href={`${registering ? "/login" : "/register"}?returnTo=${encodeURIComponent(returnTo)}`}>{registering ? "Sign in" : "Create an account"}</Link></p>
    </Card>
    <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">You can always <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">order as a guest</Link>.</p>
  </section>;
}
