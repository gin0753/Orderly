import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminRouteGuard } from "@/features/auth/components/admin-route-guard";
import { QueryProvider } from "@/providers/query-provider";
import { cn } from "@/lib/cn";
import { ADMIN_CONTAINER_CLASS_NAME } from "@/components/layout/constants/admin-layout.constants";

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

          <main className={cn(ADMIN_CONTAINER_CLASS_NAME, "py-6")}>
            {children}
          </main>
        </div>
      </QueryProvider>
    </AdminRouteGuard>
  );
}
