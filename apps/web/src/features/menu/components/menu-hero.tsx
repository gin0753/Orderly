import Link from "next/link";

import { ProductImage } from "@/components/ui/product-image";
import { formatMoneyFromCents } from "@/lib/format-money";

import type { MenuProduct, MenuStore } from "../types";

type MenuHeroStore = Partial<
  Pick<
    MenuStore,
    | "name"
    | "isAcceptingOrders"
    | "pickupEnabled"
    | "deliveryEnabled"
    | "estimatedPreparationMinutes"
  >
>;

type MenuHeroProduct = Pick<
  MenuProduct,
  "name" | "imageUrl" | "priceCents"
>;

type MenuHeroProps = {
  store?: MenuHeroStore | null;
  product?: MenuHeroProduct | null;
};

const actionClassName = [
  "inline-flex min-h-12 min-w-0 items-center justify-center rounded-[0.875rem]",
  "px-3 text-sm font-semibold transition",
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-[var(--color-brand-text-hover)] focus-visible:ring-offset-2",
  "sm:px-5",
].join(" ");

function getFulfillmentLabel(store?: MenuHeroStore | null) {
  if (
    typeof store?.pickupEnabled !== "boolean" ||
    typeof store.deliveryEnabled !== "boolean"
  ) {
    return null;
  }

  if (store.pickupEnabled && store.deliveryEnabled) {
    return "Pickup + delivery";
  }

  if (store.pickupEnabled) {
    return "Pickup available";
  }

  if (store.deliveryEnabled) {
    return "Delivery available";
  }

  return null;
}

function getPreparationLabel(store?: MenuHeroStore | null) {
  const minutes = store?.estimatedPreparationMinutes;

  return typeof minutes === "number" &&
    Number.isInteger(minutes) &&
    minutes > 0
    ? `Estimated prep · ${minutes} min`
    : null;
}

function getAvailabilityLabel(store?: MenuHeroStore | null) {
  if (store?.isAcceptingOrders === true) {
    return "Accepting orders";
  }

  if (store?.isAcceptingOrders === false) {
    return "Ordering paused";
  }

  return null;
}

export function MenuHero({ store, product }: MenuHeroProps) {
  const storeName = store?.name?.trim() || null;
  const fulfillmentLabel = getFulfillmentLabel(store);
  const preparationLabel = getPreparationLabel(store);
  const availabilityLabel = getAvailabilityLabel(store);

  return (
    <section
      aria-labelledby="homepage-hero-title"
      className={[
        "storefront-hero grid overflow-hidden rounded-[var(--radius-overlay)]",
        "bg-[var(--color-brand-surface)] text-[var(--color-on-brand)]",
        product ? "md:grid-cols-[1.04fr_0.96fr]" : "",
      ].join(" ")}
    >
      <div className="flex flex-col justify-center px-6 pb-[1.125rem] pt-[1.375rem] sm:p-8 md:min-h-[389px] md:px-8 md:py-7 lg:min-h-[405px] lg:px-10 lg:py-9 max-[359px]:px-[1.125rem] max-[359px]:pb-4 max-[359px]:pt-5">
        {storeName ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ring-on-brand)]">
            {storeName}
          </p>
        ) : null}

        <h1
          id="homepage-hero-title"
          className={`${storeName ? "mt-3 md:mt-4" : ""} max-w-xl text-balance text-[length:var(--text-display)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--color-on-brand)] md:text-[2.5rem] lg:text-[length:var(--text-display)] max-[359px]:text-[2rem]`}
        >
          Fresh comfort food, ready when you are.
        </h1>

        <p className="mt-4 max-w-md text-pretty text-[0.9375rem] leading-6 text-[var(--color-on-brand-secondary)] md:mt-5 md:text-base md:leading-7 max-[359px]:text-sm">
          Pizza, pasta and sides made for easy pickup or delivery.
        </p>

        <div className="mt-[1.125rem] grid grid-cols-2 gap-2.5 md:mt-6 md:flex md:flex-wrap md:gap-3">
          <a
            href="#menu"
            className={`${actionClassName} storefront-hero-action bg-[var(--color-brand-strong)] text-[var(--color-text-inverse)] shadow-sm hover:bg-[var(--color-brand-hover)]`}
          >
            Browse menu
          </a>

          <Link
            href="/track-order"
            className={`${actionClassName} storefront-hero-action bg-[var(--color-brand-surface-raised)] text-[var(--color-on-brand)] hover:bg-white/15`}
          >
            Track order
          </Link>
        </div>

        {fulfillmentLabel || preparationLabel || (!product && availabilityLabel) ? (
          <div
            aria-label="Ordering information"
            className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[var(--color-on-brand-secondary)] md:mt-5 md:text-[0.8125rem] max-[359px]:grid max-[359px]:grid-cols-1 max-[359px]:gap-y-1.5"
          >
            {fulfillmentLabel ? <StoreFact>{fulfillmentLabel}</StoreFact> : null}
            {preparationLabel ? <StoreFact>{preparationLabel}</StoreFact> : null}
            {!product && availabilityLabel ? (
              <StoreFact>{availabilityLabel}</StoreFact>
            ) : null}
          </div>
        ) : null}
      </div>

      {product ? (
        <div className="relative mx-[1.125rem] mb-[1.125rem] min-h-[185px] overflow-hidden rounded-[var(--radius-card)] md:m-0 md:min-h-[389px] md:rounded-none md:p-5 lg:min-h-[405px] lg:p-6 max-[359px]:mx-3.5 max-[359px]:mb-3.5 max-[359px]:min-h-40">
          <div className="absolute inset-0 overflow-hidden rounded-[1.125rem] md:inset-5 lg:inset-6">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(min-width: 1152px) 474px, (min-width: 768px) 320px, calc(100vw - 68px)"
              priority
            />

            {availabilityLabel ? (
              <span className="absolute left-3 top-3 inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-surface-glass)] px-3 text-xs font-semibold text-[var(--color-text-primary)] shadow-sm backdrop-blur">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-[var(--color-brand)]"
                />
                {availabilityLabel}
              </span>
            ) : null}

            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-[0.875rem] bg-[var(--color-surface-glass)] px-3 py-2.5 shadow-sm backdrop-blur md:inset-x-4 md:bottom-4 md:px-4 md:py-3">
              <strong className="min-w-0 truncate text-sm text-[var(--color-text-primary)]">
                {product.name}
              </strong>
              <span className="shrink-0 text-xs font-semibold text-[var(--color-text-secondary)] md:text-[0.8125rem]">
                From {formatMoneyFromCents(product.priceCents)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type StoreFactProps = {
  children: React.ReactNode;
};

function StoreFact({ children }: StoreFactProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-[var(--color-brand)]"
      />
      {children}
    </span>
  );
}
