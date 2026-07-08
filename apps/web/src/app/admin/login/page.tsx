import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[720px] max-w-6xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-[var(--color-text-primary)] p-8 text-[var(--color-text-inverse)] sm:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand)] font-bold text-[var(--color-text-inverse)]">
              O
            </div>

            <span className="text-lg font-semibold tracking-tight">
              Orderly
            </span>
          </div>

          <div className="max-w-sm space-y-5 py-16 lg:py-0">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-brand)]">
              Admin portal
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Welcome back.
            </h1>

            <p className="max-w-xs text-sm leading-6 text-[var(--color-text-inverse)] opacity-70">
              Sign in to manage incoming orders and keep operations moving
              smoothly.
            </p>
          </div>

          <p className="text-sm text-[var(--color-text-subtle)]">
            Secure access for Orderly administrators.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <Suspense fallback={<LoginFormLoadingState />}>
            <AdminLoginForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

function LoginFormLoadingState() {
  return (
    <div className="w-full max-w-md space-y-5 rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
      <div className="h-7 w-28 animate-pulse rounded bg-[var(--color-surface-disabled)]" />
      <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-disabled)]" />
      <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-disabled)]" />
      <div className="h-11 animate-pulse rounded-lg bg-[var(--color-surface-disabled)]" />
    </div>
  );
}
