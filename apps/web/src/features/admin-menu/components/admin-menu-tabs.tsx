"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_MENU_TABS = [
  {
    label: "Categories",
    href: "/admin/menu/categories",
  },
  {
    label: "Products",
    href: "/admin/menu/products",
  },
] as const;

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getTabClassName(isActive: boolean) {
  return [
    "relative px-1 py-2 text-sm font-semibold transition-colors",
    isActive
      ? "text-[var(--color-text-primary)] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--color-brand)] after:content-['']"
      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
  ].join(" ");
}

export function AdminMenuTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu management sections"
      className="border-b border-[var(--color-border)]"
    >
      <div className="flex items-center gap-8 pb-1">
        {ADMIN_MENU_TABS.map((tab) => {
          const isActive = isTabActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={getTabClassName(isActive)}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
