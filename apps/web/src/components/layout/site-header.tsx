"use client";

import Link from "next/link";

import {
  openCart,
  selectCartItemCount,
  selectCartSubtotalCents,
} from "@/features/cart/cart-slice";
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function SiteHeader() {
  const dispatch = useAppDispatch();

  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartSubtotalCents = useAppSelector(selectCartSubtotalCents);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-neutral-950">
            Orderly
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d00]" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
          <Link href="/" className="text-neutral-950">
            Menu
          </Link>
          <Link href="/" className="transition hover:text-neutral-950">
            Deals
          </Link>
          <Link href="/" className="transition hover:text-neutral-950">
            Orders
          </Link>
          <Link href="/" className="transition hover:text-neutral-950">
            Catering
          </Link>
          <Link href="/" className="transition hover:text-neutral-950">
            About
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => dispatch(openCart())}
          className="relative flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
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
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff4d00] px-1 text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            ) : null}
          </span>

          <span className="hidden sm:inline">
            {cartItemCount > 0
              ? formatMoneyFromCents(cartSubtotalCents)
              : "Cart"}
          </span>
        </button>
      </div>
    </header>
  );
}
