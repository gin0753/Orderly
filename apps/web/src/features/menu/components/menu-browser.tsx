"use client";

import { useMemo, useState } from "react";
import { MobileCartBar } from "@/features/cart/components/mobile-cart-bar";
import { addItem, openCart } from "@/features/cart/cart-slice";
import { createCartItem } from "@/features/cart/cart-utils";
import { useAppDispatch } from "@/store/hooks";
import { setCartOpener } from "@/features/cart/utils/cart-focus";

import { CategoryTabs } from "./category-tabs";
import { EmptyMenuState } from "./empty-menu-state";
import { MenuSection } from "./menu-section";
import { ProductModal } from "./product-modal/product-modal";
import { MenuCategory, MenuProduct } from "../types";

type MenuBrowserProps = {
  categories: MenuCategory[];
  isAcceptingOrders: boolean;
};

export function MenuBrowser({
  categories,
  isAcceptingOrders,
}: MenuBrowserProps) {
  const dispatch = useAppDispatch();

  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(
    null,
  );
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productOpener, setProductOpener] = useState<HTMLElement | null>(null);
  const [cartFeedback, setCartFeedback] = useState("");

  function handleAddedToCart(name: string, quantity: number) {
    setCartFeedback(`Added ${quantity} × ${name} to your cart.`);
  }

  const visibleCategories = useMemo(() => {
    if (activeCategoryId === "all") {
      return categories;
    }

    return categories.filter((category) => category.id === activeCategoryId);
  }, [activeCategoryId, categories]);

  function handleProductSelect(product: MenuProduct, opener: HTMLElement) {
    setProductOpener(opener);
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }

  function handleQuickAdd(product: MenuProduct, opener: HTMLElement) {
    if (!isAcceptingOrders) {
      return;
    }

    if (product.optionGroups.length > 0) {
      handleProductSelect(product, opener);
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

    setCartOpener(opener);
    dispatch(addItem(cartItem));
    handleAddedToCart(product.name, 1);
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

      <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 line-clamp-2 h-10 text-sm text-[var(--color-text-secondary)] sm:line-clamp-1 sm:h-5">
        {cartFeedback || "Select a dish to view details and options."}
      </p>

      {!isAcceptingOrders ? (
        <section
          role="status"
          className="mt-5 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] px-5 py-4"
        >
          <h2 className="text-base font-bold text-[var(--color-warning-strong)]">
            Ordering is paused
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            You can still browse the menu. Checkout will be available when the
            kitchen is accepting orders again.
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-warning-strong)]">
            Browsing remains available
          </p>
        </section>
      ) : null}

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
            isAcceptingOrders={isAcceptingOrders}
          />
        ))}
      </div>

      {isProductModalOpen && selectedProduct ? (
        <ProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          isAcceptingOrders={isAcceptingOrders}
          opener={productOpener}
          onAddedToCart={handleAddedToCart}
          onClose={() => {
            setIsProductModalOpen(false);
            setSelectedProduct(null);
            setProductOpener(null);
          }}
        />
      ) : null}

      <MobileCartBar />
    </>
  );
}
