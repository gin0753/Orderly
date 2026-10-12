"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api-fetch";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { customerAuthApi } from "../api/customer-auth-api";
import { customerClient } from "../api/customer-api-fetch";
import { publishCustomerSessionEvent } from "../lib/session-events";
import { customerSessionReplaced } from "../store/customer-auth-slice";
import { customerAuthFormErrors } from "../lib/validation";

export function RegistrationVerification() {
  const dispatch = useAppDispatch();
  const checkRef = useRef<Promise<string> | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"checking" | "pending" | "invalid" | "unavailable" | "complete">("checking");
  const [values, setValues] = useState({ name: "", password: "", confirmation: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    async function inspectLink() {
      const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
      if (!/^[A-Za-z0-9_-]{43}$/.test(value)) throw new ApiError(400, "Invalid verification link");
      await customerAuthApi.checkRegistration(value);
      return value;
    }
    checkRef.current ??= inspectLink();
    void checkRef.current.then((value) => { if (live) { setToken(value); setState("pending"); } }).catch((failure: unknown) => {
      if (live) setState(failure instanceof ApiError && failure.status === 400 ? "invalid" : "unavailable");
    });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const errors = customerAuthFormErrors({ ...values, email: "verified@example.test" }, true);
    const message = errors.name ?? errors.password ?? errors.confirmation;
    if (message) { setError(message); return; }
    setBusy(true); setError(null);
    try {
      const result = await customerAuthApi.completeRegistration({ token, password: values.password, name: values.name.trim() });
      customerClient.invalidate(); publishCustomerSessionEvent("changed");
      dispatch(customerSessionReplaced(result.user));
      window.history.replaceState(null, "", "/verify-email");
      try { sessionStorage.removeItem("orderly-registration-email"); } catch { /* Optional storage. */ }
      setToken(""); setValues({ name: "", password: "", confirmation: "" }); setState("complete");
    } catch { setError("Verification could not complete. The link may be expired or already used. Try again or request a new email."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="verification-heading" className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
    <Card variant="surface" className="space-y-5 p-5 sm:p-8">
      <h1 id="verification-heading" className="text-2xl font-bold">{state === "complete" ? "Email verified" : "Verify your email"}</h1>
      {state === "checking" ? <p role="status">Checking verification link…</p> : null}
      {state === "invalid" ? <p role="alert">This verification link is invalid or expired. Request a new email.</p> : null}
      {state === "unavailable" ? <><p role="alert">We could not check this link. Please try again.</p><Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button></> : null}
      {state === "complete" ? <><p role="status">Verification completed. Your account is ready and you are signed in.</p><Link className="inline-flex min-h-11 items-center underline" href="/account">Continue to your account</Link></> : null}
      {state === "pending" ? <form onSubmit={submit} aria-label="Finish registration" aria-busy={busy} className="space-y-5">
        <p>Choose your own password to create your account. Opening this link alone does not create an account.</p>
        {(["name", "password", "confirmation"] as const).map((key) => <div key={key} className="space-y-1.5">
          <label htmlFor={`verification-${key}`} className="text-sm font-semibold">{key === "name" ? "Name" : key === "password" ? "Password" : "Confirm password"}</label>
          <Input id={`verification-${key}`} type={key === "name" ? "text" : "password"} autoComplete={key === "name" ? "name" : "new-password"} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} disabled={busy} required aria-describedby={key !== "name" ? "verification-password-help" : undefined} />
        </div>)}
        <p id="verification-password-help" className="text-sm">At least 15 characters, up to 72 UTF-8 bytes. Spaces are kept.</p>
        {error ? <p ref={errorRef} tabIndex={-1} role="alert">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Verifying…" : "Verify email and create account"}</Button>
      </form> : null}
      {state !== "complete" ? <Link className="inline-flex min-h-11 items-center underline" href="/register">Request a new verification email</Link> : null}
    </Card>
  </section>;
}
