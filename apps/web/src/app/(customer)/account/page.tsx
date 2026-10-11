"use client";

import { Suspense } from "react";
import { CustomerAccountProfile } from "@/features/customer-auth/components/customer-account-profile";
import { CustomerGoogleMethods } from "@/features/customer-auth/components/customer-google-methods";
import { CustomerPasswordForm } from "@/features/customer-auth/components/customer-password-form";

export default function AccountPage() {
  return <div className="mx-auto w-full max-w-3xl">
    <div className="mb-8">
      <p className="text-sm font-semibold text-[var(--color-brand-text)]">Your Orderly account</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Account</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Keep your details and sign-in methods up to date.</p>
    </div>
    <div className="space-y-6">
      <CustomerAccountProfile />
      <section id="security" aria-labelledby="security-heading" className="scroll-mt-24 rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-8">
        <h2 id="security-heading" tabIndex={-1} className="text-xl font-bold">Sign-in &amp; Security</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Manage how you sign in and keep your account secure.</p>
        <Suspense fallback={null}><CustomerGoogleMethods collapsible /></Suspense>
        <CustomerPasswordForm collapsible />
      </section>
    </div>
  </div>;
}
