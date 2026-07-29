import type {
  AdminProductDetail,
  CreateAdminProductRequest,
  UpdateAdminProductRequest,
} from "../types/admin-product.types";
import type { AdminProductFormValues } from "../types/admin-product-form.types";

export const EMPTY_ADMIN_PRODUCT_FORM_VALUES: AdminProductFormValues = {
  name: "",
  description: "",
  categoryId: "",
  basePrice: "",
  imageUrl: "",
};

export function parsePriceToCents(value: string) {
  const normalizedValue = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = normalizedValue.split(".");

  const wholeCents = Number.parseInt(wholePart, 10) * 100;

  const fractionalCents = Number.parseInt(
    decimalPart.padEnd(2, "0") || "0",
    10,
  );

  const totalCents = wholeCents + fractionalCents;

  return Number.isSafeInteger(totalCents) ? totalCents : null;
}

export function formatCentsForPriceInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export function mapProductToFormValues(
  product: AdminProductDetail,
): AdminProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    categoryId: product.category.id,
    basePrice: formatCentsForPriceInput(product.basePriceCents),
    imageUrl: product.imageUrl ?? "",
  };
}

export function mapFormValuesToCreateRequest(
  values: AdminProductFormValues,
): CreateAdminProductRequest {
  const basePriceCents = parsePriceToCents(values.basePrice);

  if (basePriceCents === null) {
    throw new Error("Product price is invalid.");
  }

  const description = values.description.trim();

  const imageUrl = values.imageUrl.trim();

  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    basePriceCents,
    ...(description
      ? {
          description,
        }
      : {}),
    ...(imageUrl
      ? {
          imageUrl,
        }
      : {}),
  };
}

export function mapFormValuesToUpdateRequest(
  values: AdminProductFormValues,
): UpdateAdminProductRequest {
  const basePriceCents = parsePriceToCents(values.basePrice);

  if (basePriceCents === null) {
    throw new Error("Product price is invalid.");
  }

  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    basePriceCents,
    description: values.description.trim() || null,
    imageUrl: values.imageUrl.trim() || null,
  };
}

export function validateAdminProductImageUrl(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return true;
  }

  if (normalizedValue.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
