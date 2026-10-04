import type { Metadata } from "next";

import { getMenu } from "@/features/menu/api/get-menu";
import { MenuBrowser } from "@/features/menu/components/menu-browser";
import { MenuHero } from "@/features/menu/components/menu-hero";
import { selectHomepageHeroProduct } from "@/features/menu/utils/select-homepage-hero-product";

export const metadata: Metadata = {
  title: "Online Ordering",
  description:
    "Browse the Orderly Kitchen menu and order pizza, pasta and sides for pickup or delivery.",
};

export default async function HomePage() {
  const menu = await getMenu();

  const heroProduct = selectHomepageHeroProduct(menu.categories);

  return (
    <div className="bg-[var(--color-background)]">
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
        <MenuBrowser
          categories={menu.categories}
          isAcceptingOrders={menu.store?.isAcceptingOrders ?? false}
        />
      </div>
    </div>
  );
}
