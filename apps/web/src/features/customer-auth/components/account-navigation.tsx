"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { navigateAccountSection, useLocationHash } from "../lib/account-section-navigation";

export function AccountNavigation() {
  const pathname = usePathname();
  const hash = useLocationHash();
  const orders = pathname.startsWith("/account/orders");
  const active = orders ? "Orders" : hash === "#security" ? "Sign-in & Security" : "Profile";
  useEffect(() => {
    if (pathname !== "/account" || !["#profile", "#security"].includes(hash)) return;
    const frame = requestAnimationFrame(() => document.getElementById(`${hash.slice(1)}-heading`)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [hash, pathname]);

  return <nav aria-label="Account sections" className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col">
    {[{ label: "Profile", href: "/account#profile" }, { label: "Orders", href: "/account/orders" }, { label: "Sign-in & Security", href: "/account#security" }].map((link) =>
      <Link key={link.href} href={link.href} aria-current={active === link.label ? "location" : undefined}
        onClick={(event) => navigateAccountSection(event, pathname, link.href)}
        className={`flex min-h-11 items-center rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition-colors duration-[var(--motion-feedback)] ${active === link.label ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-text)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"}`}>{link.label}</Link>)}
  </nav>;
}
