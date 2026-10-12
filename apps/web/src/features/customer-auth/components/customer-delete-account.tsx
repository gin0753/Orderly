"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { containDialogFocus } from "@/components/ui/dialog-focus";
import { ApiError } from "@/lib/api-fetch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { customerAuthApi } from "../api/customer-auth-api";
import { customerClient } from "../api/customer-api-fetch";
import { customerAccountDeleted, customerSessionExpired } from "../store/customer-auth-slice";
import { publishCustomerSessionEvent } from "../lib/session-events";
import { clearDeletedCustomerData } from "../lib/deletion-cleanup";
import { navigateToGoogle } from "../lib/google-navigation";
import { getTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";

export function CustomerDeleteAccount() {
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (customer && !customer.authMethods.password) void (async () => {
      try { const result = await customerAuthApi.deletionStatus(); if (live) setReady(result.ready); } catch { if (live) setReady(false); }
    })();
    return () => { live = false; };
  }, [customer]);
  useEffect(() => { if (dialog.current?.open) dialog.current.close(); }, [customer?.id]);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  if (!customer) return null;
  const hasPassword = customer.authMethods.password;
  function open() { setPassword(""); setConfirmed(false); setError(null); dialog.current?.showModal(); cancel.current?.focus(); }
  function close() { if (busy) return; dialog.current?.close(); setPassword(""); setConfirmed(false); trigger.current?.focus(); }
  async function reauthenticate() {
    setBusy(true); setError(null);
    try { const result = await customerAuthApi.googleDeleteStart(); navigateToGoogle(result.authorizationUrl); }
    catch { setError("Google verification could not start. Please try again."); setBusy(false); }
  }
  function finish(clearSavedReceipt = false, confirmedDeletion = true) {
    if (!customer) return;
    customerClient.invalidate();
    if (confirmedDeletion) {
      clearDeletedCustomerData(customer.id, clearSavedReceipt);
      dispatch(customerAccountDeleted());
      publishCustomerSessionEvent({ type: "deleted", customerId: customer.id });
    } else {
      dispatch(customerSessionExpired()); publishCustomerSessionEvent("ended");
    }
    dialog.current?.close(); setPassword(""); setConfirmed(false);
    router.replace("/");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !confirmed || (!hasPassword && !ready)) return;
    setBusy(true); setError(null);
    try {
      const result = await customerAuthApi.deleteAccount({ confirmation: "DELETE", ...(hasPassword ? { currentPassword: password } : {}), savedReceiptNumber: getTrackingLookup()?.orderNumber });
      finish(result.clearSavedReceipt);
    } catch (failure) {
      // A lost success response must not restore private state. Check the session without destructive retries.
      if (failure instanceof ApiError && failure.status === 401) {
        try { await customerAuthApi.me(); } catch (check) {
          if (check instanceof ApiError && check.status === 401) { finish(false, false); return; }
        }
      }
      setError(failure instanceof ApiError && failure.status === 409 ? failure.message : "Account deletion did not complete. Check your password or verify with Google again, then retry. Your data is unchanged unless deletion already completed.");
      if (!hasPassword) setReady(false);
    } finally { setBusy(false); }
  }
  return <Card variant="surface" className="mt-8 space-y-4 border border-[var(--color-danger-border)] p-5">
    <h3 className="text-lg font-bold text-[var(--color-danger-strong)]">Danger Zone</h3>
    <p className="text-sm leading-6">Delete your account permanently. Your profile and sign-in methods will be removed and all sessions signed out. Personal contact details on completed or cancelled orders will be erased; financial and item records will be kept. Active orders must be resolved first.</p>
    {search.get("deletion") === "failed" ? <p role="alert" className="text-sm">Google did not provide fresh authentication for deletion. An existing Google session alone is insufficient. Try again after Google authenticates you afresh.</p> : null}
    {ready ? <p role="status" className="text-sm">Google verified your identity for deletion. Confirm below within five minutes.</p> : null}
    <Button ref={trigger} variant="danger" onClick={open}>Delete account</Button>
    <dialog ref={dialog} aria-labelledby="delete-account-heading" aria-describedby="delete-account-explanation" onKeyDown={containDialogFocus}
      onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => { setPassword(""); setConfirmed(false); }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 text-[var(--color-text-primary)] backdrop:bg-black/50 sm:p-8">
      <h2 id="delete-account-heading" className="text-xl font-bold">Permanently delete account?</h2>
      <p id="delete-account-explanation" className="mt-3 text-sm leading-6">This cannot be undone. Signing up again creates a new account without your historical orders. Copies in backups or provider logs are not erased by this action.</p>
      <form onSubmit={(event) => { void submit(event); }} aria-busy={busy} className="mt-5 space-y-5">
        {hasPassword ? <div><label htmlFor="delete-current-password" className="mb-2 block text-sm font-semibold">Current password to delete account</label><Input id="delete-current-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} /></div> : <Button type="button" variant="secondary" disabled={busy} onClick={() => { void reauthenticate(); }}>Verify identity with Google</Button>}
        <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={busy} className="mt-1 size-5 shrink-0" />I understand this permanently deletes my customer account.</label>
        {error ? <p ref={alert} role="alert" tabIndex={-1} className="text-sm text-[var(--color-danger-strong)]">{error}</p> : null}
        {busy ? <p role="status" className="text-sm">Processing your request…</p> : null}
        <div className="flex flex-wrap gap-3"><Button ref={cancel} type="button" variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant="danger" disabled={busy || !confirmed || (hasPassword ? !password : !ready)}>Permanently delete account</Button></div>
      </form>
    </dialog>
  </Card>;
}
