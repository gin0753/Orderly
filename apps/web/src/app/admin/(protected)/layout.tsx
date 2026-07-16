import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminRouteGuard } from "@/features/auth/components/admin-route-guard";
import { QueryProvider } from "@/providers/query-provider";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  return (
    <AdminRouteGuard>
      <QueryProvider>
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
          <AdminHeader />

          <main>{children}</main>
        </div>
      </QueryProvider>
    </AdminRouteGuard>
  );
}
