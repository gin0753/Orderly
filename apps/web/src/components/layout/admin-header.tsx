import { AdminSessionActions } from "@/features/auth/components/admin-session-actions";

import { AppHeaderShell } from "./app-header-shell";
import { ADMIN_CONTAINER_CLASS_NAME } from "./constants/admin-layout.constants";

const adminNavLinks = [
  { label: "Orders", href: "/admin/orders" },
  { label: "Menu", href: "/admin/menu" },
];

export function AdminHeader() {
  return (
    <AppHeaderShell
      logoHref="/admin/orders"
      navLinks={adminNavLinks}
      rightSlot={<AdminSessionActions />}
      mobileRightSlot={<AdminSessionActions variant="button" />}
      mobileFooter={<AdminSessionActions variant="button" />}
      mobileLabel="Admin navigation"
      mobileIdentitySuffix="Admin"
      containerClassName={ADMIN_CONTAINER_CLASS_NAME}
    />
  );
}
