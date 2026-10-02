"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { OrderlyLogo } from "@/components/brand/orderly-logo";
import { cn } from "@/lib/cn";
import { MobileNavigation } from "./mobile-navigation";

export type AppHeaderNavLink = {
  label: string;
  href: string;
};

type AppHeaderShellProps = {
  logoHref: string;
  navLinks: AppHeaderNavLink[];
  rightSlot: ReactNode;
  containerClassName?: string;
  mobileRightSlot?: ReactNode;
  mobileFooter?: ReactNode;
  mobileLabel?: string;
  mobileIdentitySuffix?: string;
  onBeforeMobileOpen?: () => void;
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
  mobileRightSlot,
  mobileFooter,
  mobileLabel = "Navigation",
  mobileIdentitySuffix,
  onBeforeMobileOpen,
}: AppHeaderShellProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface-glass)] backdrop-blur">
      <div
        className={cn(
          "grid h-16 grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between",
          containerClassName ?? "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
        )}
      >
        <div className="justify-self-start md:hidden">
          <MobileNavigation links={navLinks} label={mobileLabel}
            identitySuffix={mobileIdentitySuffix} footer={mobileFooter}
            onBeforeOpen={onBeforeMobileOpen} />
        </div>
        <Link href={logoHref} className="flex min-h-12 items-center gap-2">
          <OrderlyLogo size="md" />
          {mobileIdentitySuffix ? <span className="text-sm font-semibold md:hidden">{mobileIdentitySuffix}</span> : null}
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => {
            const isActive = isNavLinkActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  isActive ? (pathname === link.href ? "page" : "location") : undefined
                }
                className={getNavLinkClassName(isActive)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {mobileRightSlot ? (
          <>
            <div className="justify-self-end md:hidden">{mobileRightSlot}</div>
            <div className="hidden md:block">{rightSlot}</div>
          </>
        ) : <div className="justify-self-end">{rightSlot}</div>}
      </div>
    </header>
  );
}
