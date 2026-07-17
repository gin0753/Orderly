"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { OrderlyLogo } from "@/components/brand/orderly-logo";
import { cn } from "@/lib/cn";

export type AppHeaderNavLink = {
  label: string;
  href: string;
};

type AppHeaderShellProps = {
  logoHref: string;
  navLinks: AppHeaderNavLink[];
  rightSlot: ReactNode;
  containerClassName?: string;
};

function isNavLinkActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavLinkClassName(isActive: boolean) {
  return [
    "relative px-1 py-2 text-sm font-semibold transition-colors",
    isActive
      ? "text-[var(--color-text-primary)] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--color-brand)] after:content-['']"
      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
  ].join(" ");
}

export function AppHeaderShell({
  logoHref,
  navLinks,
  rightSlot,
  containerClassName,
}: AppHeaderShellProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface-glass)] backdrop-blur">
      <div
        className={cn(
          "flex h-16 items-center justify-between",
          containerClassName ?? "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
        )}
      >
        <Link href={logoHref} className="flex items-center gap-2">
          <OrderlyLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = isNavLinkActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={getNavLinkClassName(isActive)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {rightSlot}
      </div>
    </header>
  );
}
