"use client";

import {
  openCart,
  selectCartItemCount,
  selectCartSubtotalCents,
} from "@/features/cart/cart-slice";
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { AppHeaderShell } from "./app-header-shell";
import { Button } from "../ui/button";

const navLinks = [
  { label: "Menu", href: "/" },
  { label: "Deals", href: "/deals" },
  { label: "Orders", href: "/orders" },
  { label: "Catering", href: "/catering" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const dispatch = useAppDispatch();

  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartSubtotalCents = useAppSelector(selectCartSubtotalCents);

  return (
    <AppHeaderShell
      logoHref="/"
      navLinks={navLinks}
      rightSlot={
        <Button
          type="button"
          onClick={() => dispatch(openCart())}
          className="relative flex cursor-pointer items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:border-neutral-300 hover:bg-[var(--color-surface-muted)]"
          aria-label="Open cart"
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path
                d="M6.5 7.5h14l-1.4 8.1a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L5.7 5.4a1 1 0 0 0-1-.9H3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 21a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM17.5 21a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {cartItemCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] font-bold text-[var(--color-text-inverse)]">
                {cartItemCount}
              </span>
            ) : null}
          </span>

          <span className="hidden sm:inline">
            {cartItemCount > 0
              ? formatMoneyFromCents(cartSubtotalCents)
              : "Cart"}
          </span>
        </Button>
      }
    />
  );
}
