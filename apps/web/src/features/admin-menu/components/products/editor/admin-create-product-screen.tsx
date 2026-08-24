"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useCreateAdminProduct } from "../../../mutations/use-admin-product-mutations";
import { adminMenuQueryOptions } from "../../../queries/admin-menu-query-options";
import {
  EMPTY_ADMIN_PRODUCT_FORM_VALUES,
  mapFormValuesToCreateRequest,
} from "../../../utils/admin-product-form.utils";
import type { AdminProductFormValues } from "../../../types/admin-product-form.types";
import { AdminProductEditorHeader } from "./admin-product-editor-header";
import {
  AdminProductEditorError,
  AdminProductEditorSkeleton,
} from "./admin-product-editor-state";
import { AdminProductForm } from "./form/admin-product-form";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}

export function AdminCreateProductScreen() {
  const router = useRouter();

  const categoriesQuery = useQuery(adminMenuQueryOptions.categoryOptions());

  const createProductMutation = useCreateAdminProduct();

  function handleBack() {
    router.push("/admin/menu/products");
  }

  async function handleSubmit(values: AdminProductFormValues) {
    const product = await createProductMutation.mutateAsync(
      mapFormValuesToCreateRequest(values),
    );

    router.replace(`/admin/menu/products/${product.id}/edit`);
  }

  if (categoriesQuery.isPending) {
    return <AdminProductEditorSkeleton />;
  }

  if (categoriesQuery.isError) {
    return (
      <AdminProductEditorError
        title="Product editor could not be loaded"
        message={
          categoriesQuery.error instanceof Error
            ? categoriesQuery.error.message
            : "Unable to load menu categories."
        }
        onBack={handleBack}
        onRetry={() => {
          void categoriesQuery.refetch();
        }}
      />
    );
  }

  const categories = categoriesQuery.data ?? [];

  if (categories.length === 0) {
    return (
      <div className="space-y-5">
        <AdminProductEditorHeader mode="create" onBack={handleBack} />

        <Card
          className={[
            "border border-[var(--color-border)]",
            "bg-[var(--color-surface)]",
            "px-6 py-12 text-center",
          ].join(" ")}
        >
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Create a category first
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-text-secondary)]">
            Every product must belong to a menu category.
          </p>

          <div className="mt-5">
            <Button
              type="button"
              onClick={() => router.push("/admin/menu/categories")}
            >
              Go to categories
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminProductEditorHeader mode="create" onBack={handleBack} />

      <AdminProductForm
        mode="create"
        defaultValues={EMPTY_ADMIN_PRODUCT_FORM_VALUES}
        categories={categories}
        isSubmitting={createProductMutation.isPending}
        errorMessage={getErrorMessage(createProductMutation.error)}
        onCancel={handleBack}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
