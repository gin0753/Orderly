import type { PropsWithChildren } from "react";

import { AdminMenuTabs } from "./admin-menu-tabs";

type AdminMenuShellProps = PropsWithChildren;

export function AdminMenuShell({ children }: AdminMenuShellProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Menu Management
        </h1>

        <p className="text-sm text-[var(--color-text-muted)]">
          Manage your menu categories, products and availability.
        </p>
      </header>

      <AdminMenuTabs />

      <div>{children}</div>
    </section>
  );
}
