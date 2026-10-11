import type { ReactNode } from "react";

import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { QueryProvider } from "@/providers/query-provider";
import { CustomerAuthBootstrap } from "@/features/customer-auth/components/customer-auth-bootstrap";

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider><CustomerAuthBootstrap /><div className="customer-theme flex min-h-dvh flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[var(--color-surface)] focus:px-4 focus:py-3 focus:text-[var(--color-brand-text)]">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </div></QueryProvider>
  );
}
