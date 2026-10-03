/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { CategoryTabs } from "@/features/menu/components/category-tabs";
import { MenuSection } from "@/features/menu/components/menu-section";
import type {
  MenuCategory,
  MenuProduct,
} from "@/features/menu/types";
import { selectHomepageHeroProduct } from "@/features/menu/utils/select-homepage-hero-product";

function createProduct(
  name: string,
  imageUrl: string | null,
  isAvailable = true,
): MenuProduct {
  return {
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    description: `${name} description`,
    imageUrl,
    priceCents: 1500,
    isAvailable,
    optionGroups: [],
  };
}

function createCategory(
  name: string,
  products: MenuProduct[],
): MenuCategory {
  return {
    id: name.toLowerCase(),
    name,
    slug: name.toLowerCase(),
    sortOrder: 1,
    products,
  };
}

describe("homepage hero-product selection", () => {
  const margherita = createProduct(
    "Margherita",
    "/images/menu/margherita-pizza-v1.webp",
  );
  const roastedMushroom = createProduct(
    "Roasted Mushroom",
    "/images/menu/roasted-mushroom-pizza-v1.webp",
  );

  it("prefers an available Roasted Mushroom with an approved image", () => {
    expect(
      selectHomepageHeroProduct([
        createCategory("Pizza", [margherita, roastedMushroom]),
      ]),
    ).toBe(roastedMushroom);
  });

  it("falls back to the first available product with an approved image", () => {
    const invalidRoastedMushroom = createProduct(
      "Roasted Mushroom",
      "https://example.com/mushroom.webp",
    );

    expect(
      selectHomepageHeroProduct([
        createCategory("Pizza", [invalidRoastedMushroom, margherita]),
      ]),
    ).toBe(margherita);
  });

  it("returns the first available product when no image is usable", () => {
    const imageMissing = createProduct("Image Missing", null);
    const imageInvalid = createProduct("Image Invalid", "/image.jpg");

    expect(
      selectHomepageHeroProduct([
        createCategory("Pizza", [imageMissing, imageInvalid]),
      ]),
    ).toBe(imageMissing);
  });

  it("handles an empty or unavailable menu safely", () => {
    expect(selectHomepageHeroProduct([])).toBeNull();
    expect(
      selectHomepageHeroProduct([
        createCategory("Pizza", [createProduct("Unavailable", null, false)]),
      ]),
    ).toBeNull();
  });
});

describe("homepage menu navigation", () => {
  const pizza = createCategory("Pizza", [
    createProduct("Margherita", "/images/menu/margherita-pizza-v1.webp"),
  ]);
  const pasta = createCategory("Pasta", [
    createProduct("Carbonara", "/images/menu/creamy-carbonara-v1.webp"),
  ]);

  it("provides the menu anchor and exposes category selection", () => {
    render(
      <CategoryTabs
        categories={[pizza, pasta]}
        activeCategoryId={pizza.id}
        onCategoryChange={jest.fn()}
      />,
    );

    expect(document.getElementById("menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /Pizza/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Pasta/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("renders products without an inert See all control", () => {
    render(
      <MenuSection
        sectionId="menu-section-pizza"
        title="Pizza"
        itemCount={pizza.products.length}
        products={pizza.products}
        onProductSelect={jest.fn()}
        onQuickAdd={jest.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Pizza" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View Margherita" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See all" })).toBeNull();
  });
});
