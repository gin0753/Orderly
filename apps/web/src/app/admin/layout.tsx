import type { ReactNode } from "react";

import { AdminAuthBootstrap } from "@/features/auth/components/admin-auth-bootstrap";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
      <AdminAuthBootstrap />
      {children}
    </>
  );
}
