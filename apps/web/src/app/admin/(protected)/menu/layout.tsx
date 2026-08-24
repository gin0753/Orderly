import { PropsWithChildren } from "react";

import { AdminMenuShell } from "@/features/admin-menu";

type AdminMenuLayoutProps = PropsWithChildren;

export default function AdminMenuLayout({ children }: AdminMenuLayoutProps) {
  return <AdminMenuShell>{children}</AdminMenuShell>;
}
