"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const busy = auth.operation === "login" || auth.operation === "register";
  const unresolved = auth.status === "idle" || auth.status === "loading";

  useEffect(() => { dispatch(clearCustomerFeedback()); }, [dispatch, mode]);
  useEffect(() => {
    let live = true;
    void customerAuthApi.googleStatus().then((result) => { if (live) setGoogleAvailable(result.enabled); }).catch(() => { if (live) setGoogleError("Google sign-in is temporarily unavailable."); });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (auth.status === "authenticated") router.replace(returnTo); }, [auth.status, returnTo, router]);
  useEffect(() => { if (auth.error && !auth.operation) errorRef.current?.focus(); }, [auth.error, auth.operation]);

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
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus());
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
        aria-describedby={errors[key] ? `customer-${key}-error` : key === "password" && registering ? "customer-password-help" : undefined}
        disabled={busy} className="h-11 w-full" required />
      {errors[key] ? <p id={`customer-${key}-error`} className="text-sm text-[var(--color-danger-strong)]">{errors[key]}</p> : null}
    </div>;
  }

  return <section className="mx-auto w-full max-w-md px-4 py-6 sm:py-10">
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{registering ? "Create your account" : "Sign in to Orderly"}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{registering ? "A place for your Orderly account." : "Welcome back. Enter your details below."}</p>
      {auth.notice ? <p role="status" className="mt-4 text-sm">{auth.notice}</p> : null}
      {search.get("google") === "conflict" ? <p role="alert" className="mt-4 rounded-xl bg-[var(--color-danger-background)] p-3 text-sm">An Orderly account already uses this email. Sign in with your password, then connect Google from your account.</p> : null}
      {search.get("google") === "failed" || search.get("google") === "cancelled" ? <p role="alert" className="mt-4 rounded-xl bg-[var(--color-danger-background)] p-3 text-sm">Google sign-in did not complete. Please try again.</p> : null}
      {unresolved ? <p role="status" className="mt-4 text-sm">Checking your session…</p> : null}
      {auth.status === "error" ? <div className="mt-4 space-y-2 text-sm"><p>We couldn’t check your existing session. You can try again or sign in below.</p><Button variant="secondary" onClick={() => { void dispatch(bootstrapCustomer()); }}>Check session again</Button></div> : null}
      <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy} className="mt-6 space-y-4">
        {registering ? field("name", "Name", "name") : null}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", registering ? "new-password" : "current-password", showPassword ? "text" : "password")}
        {registering ? <p id="customer-password-help" className="text-xs leading-5 text-[var(--color-text-secondary)]">At least 15 characters, up to 72 UTF-8 bytes. Spaces are kept.</p> : null}
        {registering ? field("confirmation", "Confirm password", "new-password", showPassword ? "text" : "password") : null}
        <label className="flex min-h-8 items-center gap-2 text-sm"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} disabled={busy} className="accent-[var(--color-brand-strong)]" />Show password</label>
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
      {googleError ? <p role="alert" className="mt-3 text-sm text-[var(--color-danger-strong)]">{googleError}</p> : null}
      <p className="mt-5 text-center text-sm">{registering ? "Already have an account? " : "New to Orderly? "}<Link className="font-semibold text-[var(--color-brand-text)] underline underline-offset-4" href={`${registering ? "/login" : "/register"}?returnTo=${encodeURIComponent(returnTo)}`}>{registering ? "Sign in" : "Create an account"}</Link></p>
    </div>
    <p className="mt-5 text-center text-sm text-[var(--color-text-secondary)]">You can always <Link href="/" className="underline underline-offset-4">order as a guest</Link>.</p>
  </section>;
}
