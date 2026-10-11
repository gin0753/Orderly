"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/store/hooks";
import { customerAuthApi } from "../api/customer-auth-api";
import { navigateToGoogle } from "../lib/google-navigation";
import { GoogleLogo } from "./google-brand";

export function CustomerGoogleMethods({ collapsible = false }: { collapsible?: boolean }) {
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedCallback, setDismissedCallback] = useState<string | null>(null);
  const googleResult = search.get("google");
  const [googleAvailable, setGoogleAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    void customerAuthApi.googleStatus().then(
      (result) => { if (active) setGoogleAvailable(result.enabled); },
      () => { if (active) setGoogleAvailable(false); },
    );
    return () => { active = false; };
  }, []);
  if (!customer) return null;

  async function connect(event: FormEvent) {
    event.preventDefault();
    if (!googleAvailable || !password || busy) return;
    setBusy(true); setError(null); setDismissedCallback(googleResult);
    try {
      const result = await customerAuthApi.googleConnect(password);
      navigateToGoogle(result.authorizationUrl);
    } catch {
      setError("Google could not be connected. Please try again.");
      setBusy(false);
    }
  }

  const connectionForm = <form onSubmit={(event) => { void connect(event); }} className="mt-5 space-y-3">
    <label htmlFor="connect-google-password" className="block text-sm font-semibold">Current password to connect Google</label>
    <Input id="connect-google-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
    <Button type="submit" variant="secondary" disabled={busy || !password}><GoogleLogo />{busy ? "Connecting…" : "Connect Google"}</Button>
  </form>;

  // Conflict covers several linking rules; it does not prove an email mismatch.
  const callbackMessages: Record<string, string> = {
    failed: "Google could not be connected. Please try again.",
    cancelled: "Google authorization was not completed. Try again when you’re ready.",
    conflict: "This Google account could not be linked to your Orderly account. Check that you’re using the intended account and try again.",
  };
  const callbackError = googleResult !== dismissedCallback ? callbackMessages[googleResult ?? ""] : null;
  const connectionError = customer.authMethods.google || googleResult === "connected" ? null : error ?? callbackError;

  return <section className="mt-7 border-t border-[var(--color-border)] pt-6" aria-labelledby="customer-methods-heading">
    <h3 id="customer-methods-heading" className="text-base font-bold">Sign-in methods</h3>
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex justify-between gap-3"><dt>Email and password</dt><dd>{customer.authMethods.password ? "Connected" : "Not configured"}</dd></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><dt className="flex items-center gap-2"><GoogleLogo />Google</dt><dd>{customer.authMethods.google ? "Connected" : "Not connected"}</dd></div>
    </dl>
    {search.get("google") === "connected" ? <p role="status" className="mt-3 text-sm">Google is connected to your account.</p> : null}
    {connectionError ? <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-3 text-sm text-[var(--color-danger-strong)]">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0"><h4 className="font-semibold">Google connection unsuccessful</h4><p className="mt-1 leading-5">{connectionError}</p></div>
    </div> : null}
    {customer.authMethods.password && !customer.authMethods.google && !googleAvailable ? <p className="mt-3 text-sm">Google connection is currently unavailable.</p> : null}
    {customer.authMethods.password && !customer.authMethods.google && googleAvailable ? (collapsible ? <details className="mt-4">
      <summary className="min-h-11 cursor-pointer rounded-xl py-3 text-sm font-semibold">Connect Google</summary>{connectionForm}
    </details> : connectionForm) : null}
  </section>;
}
