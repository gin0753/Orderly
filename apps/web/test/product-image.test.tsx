/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { ProductImage } from "@/components/ui/product-image";
import {
  EMPTY_ADMIN_PRODUCT_FORM_VALUES,
  mapFormValuesToCreateRequest,
  mapFormValuesToUpdateRequest,
  validateAdminProductImageUrl,
} from "@/features/admin-menu/utils/admin-product-form.utils";
import { AdminProductImagePreview } from "@/features/admin-menu/components/products/editor/form/admin-product-image-preview";

const first = "/images/menu/margherita-pizza-v1.webp";
const second = "/images/menu/pepperoni-pizza-v1.webp";

describe("admin image payload mapping", () => {
  const populatedForm = {
    ...EMPTY_ADMIN_PRODUCT_FORM_VALUES,
    name: "Margherita",
    categoryId: "pizza-category",
    basePrice: "14.90",
    imageUrl: first,
  };

  it.each(["", "   "])("omits an empty image on create: %j", (imageUrl) => {
    const payload = mapFormValuesToCreateRequest({
      ...populatedForm,
      imageUrl,
    });
    expect(payload).not.toHaveProperty("imageUrl");
  });

  it.each(["", "   "])(
    "clears an existing image with null on update: %j",
    (imageUrl) => {
      expect(mapFormValuesToUpdateRequest(populatedForm).imageUrl).toBe(first);
      const payload = mapFormValuesToUpdateRequest({
        ...populatedForm,
        imageUrl,
      });
      expect(payload).toHaveProperty("imageUrl", null);
    },
  );
});

describe("product image", () => {
  it("renders a valid optimized source with the product alt and supplied sizes", () => {
    render(<ProductImage src={first} alt="Margherita" sizes="72px" />);
    const image = screen.getByRole("img", { name: "Margherita" });
    expect(image).toHaveAttribute("sizes", "72px");
    expect(image.getAttribute("src")).toContain(encodeURIComponent(first));
  });
  it.each([
    undefined,
    null,
    "",
    "https://example.com/broken.webp",
    "//example.com/broken.webp",
    "/images/menu/../invalid.webp",
  ])("uses the neutral fallback for %s", (src) => {
    const { container } = render(
      <ProductImage src={src} alt="Margherita" sizes="72px" />,
    );
    expect(
      screen.getByRole("img", { name: "Margherita — image unavailable" }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
  it("removes failed images and retries after each source change, including returning to the original", () => {
    const { rerender } = render(
      <ProductImage src={first} alt="Pizza" sizes="72px" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Pizza" }));
    expect(
      screen.getByRole("img", { name: "Pizza — image unavailable" }),
    ).toBeInTheDocument();
    rerender(<ProductImage src={second} alt="Pizza" sizes="72px" />);
    expect(screen.getByRole("img", { name: "Pizza" }).tagName).toBe("IMG");
    rerender(<ProductImage src={first} alt="Pizza" sizes="72px" />);
    expect(screen.getByRole("img", { name: "Pizza" }).tagName).toBe("IMG");
  });
  it("keeps decorative images and their fallback out of the accessibility tree", () => {
    const { container } = render(
      <ProductImage src={first} alt="" sizes="48px" />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    fireEvent.error(container.querySelector("img")!);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("admin image path validation", () => {
  it.each([undefined, null, "", first, "/images/menu/cola-330-v12.webp"])(
    "accepts %s",
    (value) => {
      expect(validateAdminProductImageUrl(value)).toBe(true);
    },
  );
  it.each([
    "https://example.com/item.webp",
    "http://example.com/item.webp",
    "//example.com/item.webp",
    "/images/menu/../item-v1.webp",
    "/images/menu/%2e%2e/item-v1.webp",
    "/images/menu/item.jpg",
    "/images/menu/item.webp",
    "/images/menu/item-v0.webp",
    "/images/menu/Item-v1.webp",
    first + "?x=1",
    first + "\n",
  ])("rejects %s", (value) => {
    expect(validateAdminProductImageUrl(value)).toBe(false);
  });
});

it("keeps the admin preview retry action and clears failure when the path changes", () => {
  const { rerender } = render(
    <AdminProductImagePreview imageUrl={first} productName="Margherita" />,
  );
  fireEvent.error(screen.getByRole("img", { name: "Margherita preview" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "The image could not be loaded",
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.error(screen.getByRole("img", { name: "Margherita preview" }));
  rerender(
    <AdminProductImagePreview imageUrl={second} productName="Pepperoni" />,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("img", { name: "Pepperoni preview" }).tagName).toBe(
    "IMG",
  );
});
