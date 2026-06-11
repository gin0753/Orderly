"use client";

import { useMemo, useState } from "react";
import { MobileCartBar } from "@/features/cart/components/mobile-cart-bar";
import { addItem, openCart } from "@/features/cart/cart-slice";
import { createCartItem } from "@/features/cart/cart-utils";
import { useAppDispatch } from "@/store/hooks";

import { CategoryTabs } from "./category-tabs";
import { EmptyMenuState } from "./empty-menu-state";
import { MenuSection } from "./menu-section";
import { ProductModal } from "./product-modal/product-modal";
import { MenuCategory, MenuProduct } from "../types";

type MenuBrowserProps = {
  categories: MenuCategory[];
};

function getCategoryEmoji(categoryName: string) {
  const normalizedName = categoryName.toLowerCase();

  if (normalizedName.includes("pizza")) return "🍕";
  if (normalizedName.includes("burger")) return "🍔";
  if (normalizedName.includes("side")) return "🍟";
  if (normalizedName.includes("drink")) return "🥤";
  if (normalizedName.includes("dessert")) return "🍰";

  return "";
}

export function MenuBrowser({ categories }: MenuBrowserProps) {
  const dispatch = useAppDispatch();

  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(
    null,
  );
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const visibleCategories = useMemo(() => {
    if (activeCategoryId === "all") {
      return categories;
    }

    return categories.filter((category) => category.id === activeCategoryId);
  }, [activeCategoryId, categories]);

  function handleProductSelect(product: MenuProduct) {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }

  function handleQuickAdd(product: MenuProduct) {
    const cartItem = createCartItem({
      product,
      selectedSize: "medium",
      selectedAddOns: [],
      quantity: 1,
    });

    dispatch(addItem(cartItem));
    dispatch(openCart());
  }

  if (categories.length === 0) {
    return <EmptyMenuState />;
  }

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onCategoryChange={setActiveCategoryId}
      />

      <div className="pb-28 md:pb-0">
        {visibleCategories.map((category) => (
          <MenuSection
            key={category.id}
            title={category.name}
            emoji={getCategoryEmoji(category.name)}
            itemCount={category.products.length}
            products={category.products}
            onProductSelect={handleProductSelect}
            onQuickAdd={handleQuickAdd}
          />
        ))}
      </div>

      {isProductModalOpen && selectedProduct ? (
        <ProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      ) : null}

      <MobileCartBar />
    </>
  );
}
