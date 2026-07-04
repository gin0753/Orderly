import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminRouteGuard } from "@/features/auth/components/admin-route-guard";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  return (
    <AdminRouteGuard>
      <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <AdminHeader />
        {children}
      </main>
    </AdminRouteGuard>
  );
}
