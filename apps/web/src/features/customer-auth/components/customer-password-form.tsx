"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { customerAuthApi } from "../api/customer-auth-api";
import { customerClient } from "../api/customer-api-fetch";
import { passwordErrors } from "../lib/account-validation";
import { publishCustomerSessionEvent } from "../lib/session-events";
import { customerSessionReplaced } from "../store/customer-auth-slice";

export function CustomerPasswordForm({ collapsible = false }: { collapsible?: boolean }) {
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const dispatch = useAppDispatch();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof passwordErrors>>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  if (!customer?.authMethods.password) return <p className="mt-5 text-sm text-[var(--color-text-secondary)]">Password is not configured for this account.</p>;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = passwordErrors(current, next, confirmation);
    setErrors(nextErrors); setFeedback("");
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      const result = await customerAuthApi.changePassword({ currentPassword: current, newPassword: next });
      customerClient.invalidate();
      dispatch(customerSessionReplaced(result.user));
      publishCustomerSessionEvent("changed");
      setCurrent(""); setNext(""); setConfirmation("");
      setFeedback("Password changed. Other sessions have been signed out.");
    } catch (error) {
      setFeedback(error instanceof Error && error.message === "Current password is incorrect." ? error.message : "We couldn’t change your password. Please try again.");
    } finally { setBusy(false); }
  }

  const form = <form onSubmit={(event) => { void save(event); }} className="mt-5 space-y-4" noValidate>
    {!collapsible ? <h3 className="text-base font-bold">Change password</h3> : null}
    <div><label htmlFor="account-current-password" className="mb-2 block text-sm font-semibold">Current password</label><Input id="account-current-password" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} disabled={busy} aria-invalid={Boolean(errors.current)} aria-describedby={errors.current ? "account-current-error" : undefined} />{errors.current ? <p id="account-current-error" className="mt-1 text-sm text-[var(--color-danger-strong)]">{errors.current}</p> : null}</div>
    <div><label htmlFor="account-new-password" className="mb-2 block text-sm font-semibold">New password</label><Input id="account-new-password" type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} disabled={busy} aria-invalid={Boolean(errors.next)} aria-describedby={errors.next ? "account-new-error" : "account-password-hint"} /><p id="account-password-hint" className="mt-1 text-xs text-[var(--color-text-secondary)]">At least 15 characters, up to 72 UTF-8 bytes.</p>{errors.next ? <p id="account-new-error" className="mt-1 text-sm text-[var(--color-danger-strong)]">{errors.next}</p> : null}</div>
    <div><label htmlFor="account-confirm-password" className="mb-2 block text-sm font-semibold">Confirm new password</label><Input id="account-confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} aria-invalid={Boolean(errors.confirmation)} aria-describedby={errors.confirmation ? "account-confirm-error" : undefined} />{errors.confirmation ? <p id="account-confirm-error" className="mt-1 text-sm text-[var(--color-danger-strong)]">{errors.confirmation}</p> : null}</div>
    <Button type="submit" disabled={busy}>{busy ? "Changing…" : "Change password"}</Button>
    {feedback ? <p role={feedback.startsWith("Password changed") ? "status" : "alert"} className="text-sm">{feedback}</p> : null}
  </form>;
  return collapsible ? <details className="mt-6 border-t border-[var(--color-border)] pt-4">
    <summary className="min-h-11 cursor-pointer rounded-xl py-3 text-sm font-semibold">Change password</summary>
    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Changing your password signs out your other sessions.</p>
    {form}
  </details> : form;
}
