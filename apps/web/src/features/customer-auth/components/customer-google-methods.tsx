"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
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
    setBusy(true); setError(null);
    try {
      const result = await customerAuthApi.googleConnect(password);
      navigateToGoogle(result.authorizationUrl);
    } catch {
      setError("Google could not be connected. Check your current password and try again.");
      setBusy(false);
    }
  }

  const connectionForm = <form onSubmit={(event) => { void connect(event); }} className="mt-5 space-y-3">
    <label htmlFor="connect-google-password" className="block text-sm font-semibold">Current password to connect Google</label>
    <Input id="connect-google-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
    <Button type="submit" variant="secondary" disabled={busy || !password}><GoogleLogo />{busy ? "Connecting…" : "Connect Google"}</Button>
    {error ? <p role="alert" className="text-sm text-[var(--color-danger-strong)]">{error}</p> : null}
  </form>;

  return <section className="mt-7 border-t border-[var(--color-border)] pt-6" aria-labelledby="customer-methods-heading">
    <h3 id="customer-methods-heading" className="text-base font-bold">Sign-in methods</h3>
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex justify-between gap-3"><dt>Email and password</dt><dd>{customer.authMethods.password ? "Connected" : "Not configured"}</dd></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><dt className="flex items-center gap-2"><GoogleLogo />Google</dt><dd>{customer.authMethods.google ? "Connected" : "Not connected"}</dd></div>
    </dl>
    {search.get("google") === "connected" ? <p role="status" className="mt-3 text-sm">Google is connected to your account.</p> : null}
    {["failed", "cancelled", "conflict"].includes(search.get("google") ?? "") ? <p role="alert" className="mt-3 text-sm">Google connection did not complete. Use the Google account with your Orderly email and try again.</p> : null}
    {customer.authMethods.password && !customer.authMethods.google && !googleAvailable ? <p className="mt-3 text-sm">Google connection is currently unavailable.</p> : null}
    {customer.authMethods.password && !customer.authMethods.google && googleAvailable ? (collapsible ? <details className="mt-4">
      <summary className="min-h-11 cursor-pointer rounded-xl py-3 text-sm font-semibold">Connect Google</summary>{connectionForm}
    </details> : connectionForm) : null}
  </section>;
}
