import type { Metadata } from "next";

import { getMenu } from "@/features/menu/api/get-menu";
import { MenuBrowser } from "@/features/menu/components/menu-browser";
import { MenuHero } from "@/features/menu/components/menu-hero";
import { selectHomepageHeroProduct } from "@/features/menu/utils/select-homepage-hero-product";

export const metadata: Metadata = {
  title: "Orderly Kitchen | Online Ordering",
  description:
    "Browse the Orderly Kitchen menu and order pizza, pasta and sides for pickup or delivery.",
};

async function getMenuSafely() {
  try {
    return await getMenu();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const menu = await getMenuSafely();

  if (!menu)
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <MenuHero />

          <section className="mt-8 rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-6 py-8 text-center">
            <p className="text-sm font-semibold text-[var(--color-danger-strong)]">
              We couldn&apos;t load the menu right now.
            </p>
            <p className="mt-2 text-sm text-[var(--color-danger)]">
              Please try again shortly.
            </p>
          </section>
        </div>
      </main>
    );

  const heroProduct = selectHomepageHeroProduct(menu.categories);

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pt-7 lg:px-8">
        <MenuHero
          store={
            menu.store
              ? {
                  name: menu.store.name,
                  isAcceptingOrders: menu.store.isAcceptingOrders,
                  pickupEnabled: menu.store.pickupEnabled,
                  deliveryEnabled: menu.store.deliveryEnabled,
                  estimatedPreparationMinutes:
                    menu.store.estimatedPreparationMinutes,
                }
              : null
          }
          product={
            heroProduct
              ? {
                  name: heroProduct.name,
                  imageUrl: heroProduct.imageUrl,
                  priceCents: heroProduct.priceCents,
                }
              : null
          }
        />
        <MenuBrowser categories={menu.categories} />
      </div>
    </main>
  );
}
