"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { OrderlyLogo } from "@/components/brand/orderly-logo";
import { Button } from "@/components/ui/button";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import type { AppHeaderNavLink } from "./app-header-shell";

type MobileNavigationProps = {
  links: AppHeaderNavLink[];
  label: string;
  identitySuffix?: string;
  footer?: ReactNode;
  onBeforeOpen?: () => void;
};

export function MobileNavigation({
  links,
  label,
  identitySuffix,
  footer,
  onBeforeOpen,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog) return;

    dialog.showModal();
    closeRef.current?.focus();
    const desktop = window.matchMedia("(min-width: 768px)");
    function closeOnDesktop() {
      if (desktop.matches) setIsOpen(false);
    }
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="size-12 md:hidden"
        aria-label={`Open ${label.toLowerCase()}`}
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => {
          onBeforeOpen?.();
          setIsOpen(true);
        }}
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>
      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-label={label}
        aria-modal="true"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-[var(--color-text-primary)] backdrop:bg-[var(--color-overlay)]"
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
          }
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled), [tabindex="0"]',
          ));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        {isOpen ? (
          <div className="flex h-full w-[84vw] max-w-[22rem] flex-col bg-[var(--color-surface)] shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex items-baseline gap-2">
                <OrderlyLogo />
                {identitySuffix ? <span className="text-sm font-semibold">{identitySuffix}</span> : null}
              </div>
              <Button ref={closeRef} variant="ghost" size="icon" className="size-12"
                aria-label={`Close ${label.toLowerCase()}`} onClick={() => setIsOpen(false)}>
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <nav aria-label={label} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {links.map((link) => {
                const exact = pathname === link.href;
                const active = exact || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
                return (
                  <Link key={link.href} href={link.href}
                    aria-current={active ? (exact ? "page" : "location") : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-12 items-center rounded-xl border-l-4 px-4 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
                      active
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-text)]"
                        : "border-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >{link.label}</Link>
                );
              })}
            </nav>
            {footer ? <div className="shrink-0 border-t border-[var(--color-border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
