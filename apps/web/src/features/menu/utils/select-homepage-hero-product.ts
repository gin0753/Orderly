import { isProductImagePath } from "@/lib/product-image-path";

import type { MenuCategory, MenuProduct } from "../types";

function hasApprovedProductImage(product: MenuProduct) {
  return Boolean(product.imageUrl && isProductImagePath(product.imageUrl));
}

export function selectHomepageHeroProduct(
  categories: MenuCategory[],
): MenuProduct | null {
  const availableProducts = categories.flatMap((category) =>
    category.products.filter((product) => product.isAvailable),
  );

  return (
    availableProducts.find(
      (product) =>
        product.name === "Roasted Mushroom" &&
        hasApprovedProductImage(product),
    ) ??
    availableProducts.find(hasApprovedProductImage) ??
    availableProducts[0] ??
    null
  );
}
