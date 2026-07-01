import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminAuthBootstrap } from "@/features/auth/components/admin-auth-bootstrap";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  return (
    <>
      <AdminAuthBootstrap />

      <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <AdminHeader />
        {children}
      </main>
    </>
  );
}
