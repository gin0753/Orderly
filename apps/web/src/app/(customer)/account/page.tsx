"use client";

import Link from "next/link";
import { Suspense } from "react";
import { CustomerAccountProfile } from "@/features/customer-auth/components/customer-account-profile";
import { CustomerGoogleMethods } from "@/features/customer-auth/components/customer-google-methods";
import { CustomerPasswordForm } from "@/features/customer-auth/components/customer-password-form";

export default function AccountPage() {
  return <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
    <div className="mb-8">
      <p className="text-sm font-semibold text-[var(--color-brand-text)]">Your Orderly account</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Account</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Keep your details and sign-in methods up to date.</p>
    </div>
    <div className="space-y-6">
      <CustomerAccountProfile />
      <section aria-labelledby="security-heading" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8">
        <h2 id="security-heading" className="text-xl font-bold">Sign-in &amp; security</h2>
        <Suspense fallback={null}><CustomerGoogleMethods /></Suspense>
        <CustomerPasswordForm />
      </section>
    </div>
    <nav aria-label="More account options" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
      <Link href="/account/orders" className="text-[var(--color-brand-text)] underline underline-offset-4">Your orders</Link>
      <Link href="/" className="text-[var(--color-brand-text)] underline underline-offset-4">Browse menu</Link>
      <Link href="/track-order" className="text-[var(--color-brand-text)] underline underline-offset-4">Track an order</Link>
    </nav>
  </div>;
}
