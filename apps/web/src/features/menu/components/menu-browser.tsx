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
    if (product.optionGroups.length > 0) {
      handleProductSelect(product);
      return;
    }

    const cartItem = createCartItem({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
      },
      selectedOptions: [],
      quantity: 1,
    });

    dispatch(addItem(cartItem));
    dispatch(openCart());
  }

  function handleCategoryChange(categoryId: string) {
    setActiveCategoryId(categoryId);

    window.requestAnimationFrame(() => {
      const targetId =
        categoryId === "all" ? "menu" : `menu-section-${categoryId}`;

      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
  }

  if (categories.length === 0) {
    return <EmptyMenuState />;
  }

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onCategoryChange={handleCategoryChange}
      />

      <div className="pb-28 md:pb-0">
        {visibleCategories.map((category) => (
          <MenuSection
            key={category.id}
            sectionId={`menu-section-${category.id}`}
            title={category.name}
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
