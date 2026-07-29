"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useUpdateAdminProduct } from "../../../mutations/use-admin-product-mutations";
import { adminMenuQueryOptions } from "../../../queries/admin-menu-query-options";
import type { AdminProductFormValues } from "../../../types/admin-product-form.types";
import type { AdminProductCategoryFilterOption } from "../../../types/admin-product.types";
import {
  mapFormValuesToUpdateRequest,
  mapProductToFormValues,
} from "../../../utils/admin-product-form.utils";
import { AdminProductEditorHeader } from "./admin-product-editor-header";
import {
  AdminProductEditorError,
  AdminProductEditorSkeleton,
} from "./admin-product-editor-state";
import { AdminProductForm } from "./form/admin-product-form";

interface AdminEditProductScreenProps {
  productId: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}

function mergeCurrentCategory(
  categories: AdminProductCategoryFilterOption[],
  currentCategory: {
    id: string;
    name: string;
    isActive: boolean;
  },
) {
  const categoryExists = categories.some(
    (category) => category.id === currentCategory.id,
  );

  if (categoryExists) {
    return categories;
  }

  const minimumSortOrder =
    categories.length > 0
      ? Math.min(...categories.map((category) => category.sortOrder))
      : 0;

  return [
    {
      id: currentCategory.id,
      name: currentCategory.name,
      isActive: currentCategory.isActive,
      sortOrder: minimumSortOrder - 1,
    },
    ...categories,
  ];
}

export function AdminEditProductScreen({
  productId,
}: AdminEditProductScreenProps) {
  const router = useRouter();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const productQuery = useQuery(adminMenuQueryOptions.product(productId));

  const categoriesQuery = useQuery(adminMenuQueryOptions.categoryOptions());

  const updateProductMutation = useUpdateAdminProduct();

  function handleBack() {
    router.push("/admin/menu/products");
  }

  async function handleSubmit(values: AdminProductFormValues) {
    setSuccessMessage(null);

    const updatedProduct = await updateProductMutation.mutateAsync({
      productId,
      request: mapFormValuesToUpdateRequest(values),
    });

    setSuccessMessage(`“${updatedProduct.name}” saved successfully.`);
  }

  if (productQuery.isPending || categoriesQuery.isPending) {
    return <AdminProductEditorSkeleton />;
  }

  if (productQuery.isError || categoriesQuery.isError) {
    const error = productQuery.error ?? categoriesQuery.error;

    return (
      <AdminProductEditorError
        title="Product editor could not be loaded"
        message={
          error instanceof Error
            ? error.message
            : "Unable to load the product editor."
        }
        onBack={handleBack}
        onRetry={() => {
          void Promise.all([productQuery.refetch(), categoriesQuery.refetch()]);
        }}
      />
    );
  }

  const product = productQuery.data;

  if (!product) {
    return null;
  }

  const categories = mergeCurrentCategory(
    categoriesQuery.data ?? [],
    product.category,
  );

  return (
    <div className="space-y-5">
      <AdminProductEditorHeader
        mode="edit"
        productName={product.name}
        isAvailable={product.isAvailable}
        onBack={handleBack}
      />

      {successMessage ? (
        <div
          role="status"
          className={[
            "rounded-lg px-4 py-3",
            "border border-[var(--color-success)]",
            "bg-[var(--color-success-surface)]",
            "text-sm font-medium",
            "text-[var(--color-success-strong)]",
          ].join(" ")}
        >
          {successMessage}
        </div>
      ) : null}

      <AdminProductForm
        key={product.updatedAt}
        mode="edit"
        defaultValues={mapProductToFormValues(product)}
        categories={categories}
        isSubmitting={updateProductMutation.isPending}
        errorMessage={getErrorMessage(updateProductMutation.error)}
        onCancel={handleBack}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
