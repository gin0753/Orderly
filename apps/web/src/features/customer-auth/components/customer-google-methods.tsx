"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/store/hooks";
import { customerAuthApi } from "../api/customer-auth-api";
import { navigateToGoogle } from "../lib/google-navigation";

export function CustomerGoogleMethods() {
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!customer) return null;

  async function connect(event: FormEvent) {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true); setError(null);
    try {
      const result = await customerAuthApi.googleConnect(password);
      navigateToGoogle(result.authorizationUrl);
    } catch {
      setError("Google could not be connected. Check your current password and try again.");
      setBusy(false);
    }
  }

  return <section className="mt-7 border-t border-[var(--color-border)] pt-6" aria-labelledby="customer-methods-heading">
    <h2 id="customer-methods-heading" className="text-base font-bold">Sign-in methods</h2>
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex justify-between gap-3"><dt>Email and password</dt><dd>{customer.authMethods.password ? "Connected" : "Not configured"}</dd></div>
      <div className="flex justify-between gap-3"><dt>Google</dt><dd>{customer.authMethods.google ? "Connected" : "Not connected"}</dd></div>
    </dl>
    {search.get("google") === "connected" ? <p role="status" className="mt-3 text-sm">Google is connected to your account.</p> : null}
    {search.get("google") === "failed" ? <p role="alert" className="mt-3 text-sm">Google connection did not complete. Please try again.</p> : null}
    {customer.authMethods.password && !customer.authMethods.google ? <form onSubmit={(event) => { void connect(event); }} className="mt-5 space-y-3">
      <label htmlFor="connect-google-password" className="block text-sm font-semibold">Current password to connect Google</label>
      <Input id="connect-google-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} className="h-11 w-full" />
      <Button type="submit" disabled={busy || !password}>{busy ? "Connecting…" : "Connect Google"}</Button>
      {error ? <p role="alert" className="text-sm text-[var(--color-danger-strong)]">{error}</p> : null}
    </form> : null}
  </section>;
}
