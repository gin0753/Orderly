"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import type { AdminProductCategoryFilterOption } from "../../../../types/admin-product.types";
import {
  parsePriceToCents,
  validateAdminProductImageUrl,
} from "../../../../utils/admin-product-form.utils";
import { AdminProductDescriptionAssistant } from "./admin-product-description-assistant";

interface AdminProductBasicFieldsProps {
  categories: AdminProductCategoryFilterOption[];
  isSubmitting: boolean;
}

interface AdminProductFieldErrorProps {
  id: string;
  message?: string;
}

export function AdminProductFieldError({
  id,
  message,
}: AdminProductFieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      className="mt-2 text-sm text-[var(--color-danger-strong)]"
    >
      {message}
    </p>
  );
}

export function AdminProductBasicFields({
  categories,
  isSubmitting,
}: AdminProductBasicFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdminProductFormValues>();

  return (
    <section
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <header
        className={["border-b border-[var(--color-border)]", "px-6 py-5"].join(
          " ",
        )}
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Basic information
        </h2>

        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Define how this product appears in the customer menu.
        </p>
      </header>

      <div className="space-y-6 px-6 py-6">
        <div>
          <label
            htmlFor="product-name"
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Product name
            <span
              aria-hidden="true"
              className="ml-1 text-[var(--color-danger)]"
            >
              *
            </span>
          </label>

          <Input
            id="product-name"
            type="text"
            autoFocus
            autoComplete="off"
            placeholder="e.g. Margherita Pizza"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "product-name-error" : undefined}
            {...register("name", {
              validate: (value) =>
                value.trim().length > 0 || "Product name is required.",
            })}
          />

          <AdminProductFieldError
            id="product-name-error"
            message={errors.name?.message}
          />
        </div>

        <div>
          <label
            htmlFor="product-description"
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Description
          </label>

          <Textarea
            id="product-description"
            rows={5}
            maxLength={500}
            placeholder="Describe this product."
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "product-description-error" : undefined
            }
            className="resize-y"
            {...register("description", {
              maxLength: {
                value: 500,
                message: "Description must be 500 characters or fewer.",
              },
            })}
          />

          <AdminProductFieldError
            id="product-description-error"
            message={errors.description?.message}
          />

          {process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true" ? (
            <AdminProductDescriptionAssistant
              categories={categories}
              isSubmitting={isSubmitting}
            />
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="product-category"
              className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              Category
              <span
                aria-hidden="true"
                className="ml-1 text-[var(--color-danger)]"
              >
                *
              </span>
            </label>

            <select
              id="product-category"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={
                errors.categoryId ? "product-category-error" : undefined
              }
              className={[
                "h-10 w-full rounded-md px-3",
                "border border-[var(--color-border)]",
                "bg-[var(--color-surface)]",
                "text-sm text-[var(--color-text-primary)]",
                "transition-colors",
                "hover:border-[var(--color-border-hover)]",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-[var(--color-ring)]",
                "disabled:cursor-not-allowed",
                "disabled:bg-[var(--color-surface-disabled)]",
                "disabled:text-[var(--color-text-muted)]",
              ].join(" ")}
              {...register("categoryId", {
                required: "Category is required.",
              })}
            >
              <option value="">Select a category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (Inactive)"}
                </option>
              ))}
            </select>

            <AdminProductFieldError
              id="product-category-error"
              message={errors.categoryId?.message}
            />
          </div>

          <div>
            <label
              htmlFor="product-base-price"
              className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              Base price (AUD)
              <span
                aria-hidden="true"
                className="ml-1 text-[var(--color-danger)]"
              >
                *
              </span>
            </label>

            <Input
              id="product-base-price"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="14.90"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.basePrice)}
              aria-describedby={
                errors.basePrice
                  ? "product-base-price-error"
                  : "product-base-price-help"
              }
              {...register("basePrice", {
                validate: (value) => {
                  const priceCents = parsePriceToCents(value);

                  if (priceCents === null) {
                    return "Enter a valid price with up to two decimal places.";
                  }

                  return true;
                },
              })}
            />

            <p
              id="product-base-price-help"
              className="mt-2 text-xs text-[var(--color-text-muted)]"
            >
              Enter the base price before size or add-on adjustments.
            </p>

            <AdminProductFieldError
              id="product-base-price-error"
              message={errors.basePrice?.message}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="product-image-url"
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Image URL
          </label>

          <Input
            id="product-image-url"
            type="text"
            autoComplete="off"
            placeholder="https://example.com/product.jpg"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.imageUrl)}
            aria-describedby={
              errors.imageUrl
                ? "product-image-url-error"
                : "product-image-url-help"
            }
            {...register("imageUrl", {
              validate: (value) =>
                validateAdminProductImageUrl(value) ||
                "Enter a valid product image URL.",
            })}
          />

          <p
            id="product-image-url-help"
            className="mt-2 text-xs text-[var(--color-text-muted)]"
          >
            Use an allowed remote image URL or a local application image path.
          </p>

          <AdminProductFieldError
            id="product-image-url-error"
            message={errors.imageUrl?.message}
          />
        </div>
      </div>
    </section>
  );
}
