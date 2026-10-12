"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { customerAuthApi } from "../api/customer-auth-api";
import type { RegistrationResponse } from "../types";

export function RegistrationPending({ email, initial, onRestart }: { email: string; initial: RegistrationResponse; onRestart: () => void }) {
  const [result, setResult] = useState(initial);
  const [remaining, setRemaining] = useState(initial.retryAfterSeconds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, []);
  async function resend() {
    if (busy || remaining) return;
    setBusy(true); setError(false);
    try { const next = await customerAuthApi.resendRegistration(email); setResult(next); setRemaining(next.retryAfterSeconds); }
    catch { setError(true); setRemaining(60); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="verification-heading" className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
    <Card variant="surface" className="space-y-5 p-5 sm:p-8">
      <h1 id="verification-heading" className="text-2xl font-bold">Check your email</h1>
      <p role="status">If registration can proceed, a verification email has been sent. Open the link and choose your password to finish creating your account.</p>
      <p className="break-words text-sm">Pending verification for {email}. Links expire after 30 minutes. You can open the email in another browser.</p>
      {result.status === "delivery_failed" || error ? <p role="alert">Verification email delivery failed. Wait a moment, then try sending it again.</p> : null}
      <Button className="w-full" disabled={busy || remaining > 0} onClick={() => { void resend(); }}>{busy ? "Sending…" : remaining ? `Resend in ${remaining}s` : "Resend verification email"}</Button>
      <p className="text-sm text-[var(--color-text-secondary)]">Check your spam folder. Sending is limited to five emails per hour.</p>
      <Button variant="secondary" className="w-full" onClick={onRestart}>Use another email</Button>
    </Card>
  </section>;
}
