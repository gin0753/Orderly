import type { ReactNode } from "react";

import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { QueryProvider } from "@/providers/query-provider";
import { CustomerAuthBootstrap } from "@/features/customer-auth/components/customer-auth-bootstrap";

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider><CustomerAuthBootstrap /><div className="flex min-h-dvh flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </div></QueryProvider>
  );
}
