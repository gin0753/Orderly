import { Bell, Search } from "lucide-react";

import { AdminSessionActions } from "@/features/auth/components/admin-session-actions";

import { AppHeaderShell } from "./app-header-shell";
import { Button } from "../ui/button";

const adminNavLinks = [
  { label: "Orders", href: "/admin/orders" },
  { label: "Menu", href: "/admin/menu" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminHeader() {
  return (
    <AppHeaderShell
      logoHref="/admin/orders"
      navLinks={adminNavLinks}
      rightSlot={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="hidden md:inline-flex"
          >
            <Search className="size-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="relative hidden md:inline-flex"
          >
            <Bell className="size-4" />

            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-[var(--color-text-inverse)]">
              3
            </span>
          </Button>

          <AdminSessionActions />
        </div>
      }
    />
  );
}
