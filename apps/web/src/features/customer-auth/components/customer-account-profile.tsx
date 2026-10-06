"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { customerAuthApi } from "../api/customer-auth-api";
import { profileErrors } from "../lib/account-validation";
import { customerProfileUpdated } from "../store/customer-auth-slice";
import type { PublicCustomer } from "../types";

type Fields = { name: string; phone: string };
type Draft = { base: Fields; value: Fields };
function fields(customer: PublicCustomer): Fields { return { name: customer.name ?? "", phone: customer.phone ?? "" }; }

export function CustomerAccountProfile() {
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof profileErrors>>({});
  const [feedback, setFeedback] = useState("");
  if (!customer) return null;
  const baseline = draft?.base ?? fields(customer);
  const value = draft?.value ?? fields(customer);
  const dirty = value.name !== baseline.name || value.phone !== baseline.phone;
  function edit(key: keyof Fields, text: string) {
    setDraft((previous) => ({
      base: previous?.base ?? fields(customer!),
      value: { ...(previous?.value ?? fields(customer!)), [key]: text },
    }));
    setFeedback("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !dirty) return;
    const nextErrors = profileErrors(value.name, value.phone, value.name !== baseline.name);
    setErrors(nextErrors);
    setFeedback("");
    if (Object.keys(nextErrors).length) return;
    const changes = {
      ...(value.name !== baseline.name ? { name: value.name.trim() } : {}),
      ...(value.phone !== baseline.phone ? { phone: value.phone.trim() || null } : {}),
    };
    setBusy(true);
    try {
      const result = await customerAuthApi.updateProfile(changes);
      dispatch(customerProfileUpdated(result.user));
      setDraft(null);
      setFeedback("Profile saved.");
    } catch {
      setFeedback("We couldn’t save your profile. Please try again.");
    } finally { setBusy(false); }
  }

  return <section aria-labelledby="profile-heading" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8">
    <div className="mb-6"><h2 id="profile-heading" className="text-xl font-bold">Profile</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">The details you keep with your account.</p></div>
    <form onSubmit={(event) => { void save(event); }} className="space-y-5" noValidate>
      <div><label htmlFor="account-name" className="mb-2 block text-sm font-semibold">Name</label><Input id="account-name" autoComplete="name" maxLength={120} value={value.name} onChange={(event) => edit("name", event.target.value)} disabled={busy} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "account-name-error" : undefined} />{errors.name ? <p id="account-name-error" className="mt-1 text-sm text-[var(--color-danger-strong)]">{errors.name}</p> : null}</div>
      <div><label htmlFor="account-email" className="mb-2 block text-sm font-semibold">Email</label><Input id="account-email" type="email" autoComplete="email" value={customer.email} readOnly aria-describedby="account-email-note" className="bg-[var(--color-surface-disabled)]" /><p id="account-email-note" className="mt-1 text-xs text-[var(--color-text-secondary)]">Email changes are not currently supported.</p></div>
      <div><label htmlFor="account-phone" className="mb-2 block text-sm font-semibold">Phone <span className="font-normal text-[var(--color-text-secondary)]">(optional)</span></label><Input id="account-phone" type="tel" autoComplete="tel" maxLength={40} value={value.phone} onChange={(event) => edit("phone", event.target.value)} disabled={busy} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "account-phone-error" : undefined} />{errors.phone ? <p id="account-phone-error" className="mt-1 text-sm text-[var(--color-danger-strong)]">{errors.phone}</p> : null}</div>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!dirty || busy}>{busy ? "Saving…" : "Save profile"}</Button>{dirty ? <span className="text-xs text-[var(--color-text-secondary)]">Unsaved changes</span> : null}</div>
      {feedback ? <p role={feedback === "Profile saved." ? "status" : "alert"} className="text-sm">{feedback}</p> : null}
    </form>
  </section>;
}
