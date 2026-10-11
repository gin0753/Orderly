"use client";

import Link from "next/link";
import { ChevronDown, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CustomerSignOut } from "@/features/customer-auth/components/customer-sign-out";
import { useAppSelector } from "@/store/hooks";
import { navigateAccountSection } from "@/features/customer-auth/lib/account-section-navigation";

export function CustomerAccountDropdown() {
  const customer = useAppSelector((state) => state.customerAuth.customer);
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const controls = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (!desktop.matches) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", resize);
    };
  }, [open]);

  return <div ref={root} className="relative hidden md:block"
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault(); setOpen(false); trigger.current?.focus();
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (!open) {
        setOpen(true);
        requestAnimationFrame(() => {
          const items = controls();
          (event.key === "ArrowUp" || event.key === "End" ? items.at(-1) : items[0])?.focus();
        });
        return;
      }
      const items = controls();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : index < 0 && event.key === "ArrowUp" ? items.length - 1 : (index + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
      items[next]?.focus();
    }}>
    <Button ref={trigger} variant="ghost" aria-label="Account options" aria-expanded={open} aria-controls={id}
      className="gap-2" onClick={() => setOpen(!open)}>
      <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand-surface)] text-sm text-[var(--color-on-brand)]" aria-hidden="true">
        {customer?.name?.trim().slice(0, 1).toUpperCase() || <UserRound className="size-4" />}
      </span>
      <span>Account</span><ChevronDown aria-hidden="true" className={`size-4 transition-transform duration-[var(--motion-feedback)] ${open ? "rotate-180" : ""}`} />
    </Button>
    {open ? <div ref={panel} id={id} className="customer-disclosure absolute right-0 top-full mt-2 w-64 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-overlay)]">
      <div className="border-b border-[var(--color-border)] px-3 py-3">
        <p className="truncate text-sm font-semibold">{customer?.name || "Your account"}</p>
        <p className="break-all text-xs text-[var(--color-text-secondary)]">{customer?.email}</p>
      </div>
      <nav aria-label="Account options" className="py-1">
        {[{ label: "Account", href: "/account#profile" }, { label: "Orders", href: "/account/orders" }, { label: "Sign-in & Security", href: "/account#security" }].map((link) =>
          <Link key={link.href} href={link.href} onClick={(event) => { setOpen(false); navigateAccountSection(event, pathname, link.href); }}
            aria-current={link.label === "Orders" && pathname.startsWith("/account/orders") ? "location" : undefined}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors duration-[var(--motion-feedback)] hover:bg-[var(--color-surface-hover)]">{link.label}</Link>)}
      </nav>
      <div className="border-t border-[var(--color-border)] pt-1"><CustomerSignOut /></div>
    </div> : null}
  </div>;
}
