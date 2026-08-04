"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import {
  OPTION_GROUP_TYPE,
  PRODUCT_OPTION_GROUP_KIND,
  type ProductOptionGroupKind,
} from "../../../../types/admin-product.types";
import type { AdminProductOptionGroupController } from "./use-admin-product-option-group";

interface AdminProductOptionGroupSettingsProps {
  groupIndex: number;
  controller: AdminProductOptionGroupController;
}

export function AdminProductOptionGroupSettings({
  groupIndex,
  controller,
}: AdminProductOptionGroupSettingsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdminProductFormValues>();

  const groupErrors = errors.optionGroups?.[groupIndex];

  const isSizeGroup = controller.kind === PRODUCT_OPTION_GROUP_KIND.SIZE;

  function handleKindChange(value: string) {
    if (
      value !== PRODUCT_OPTION_GROUP_KIND.SIZE &&
      value !== PRODUCT_OPTION_GROUP_KIND.ADD_ON
    ) {
      return;
    }

    controller.changeKind(value as ProductOptionGroupKind);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label
            htmlFor={`option-group-${groupIndex}-name`}
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Group name
          </label>

          <Input
            id={`option-group-${groupIndex}-name`}
            placeholder="e.g. Size"
            aria-invalid={Boolean(groupErrors?.name)}
            aria-describedby={
              groupErrors?.name
                ? `option-group-${groupIndex}-name-error`
                : undefined
            }
            {...register(`optionGroups.${groupIndex}.name`, {
              validate: (value) =>
                value.trim().length > 0 || "Group name is required.",
            })}
          />

          {groupErrors?.name?.message ? (
            <p
              id={`option-group-${groupIndex}-name-error`}
              className="mt-1 text-xs text-[var(--color-danger-strong)]"
            >
              {groupErrors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`option-group-${groupIndex}-kind`}
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Kind
          </label>

          <select
            id={`option-group-${groupIndex}-kind`}
            value={controller.kind}
            onChange={(event) => handleKindChange(event.target.value)}
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
            ].join(" ")}
          >
            <option value={PRODUCT_OPTION_GROUP_KIND.SIZE}>Size</option>

            <option value={PRODUCT_OPTION_GROUP_KIND.ADD_ON}>Add-on</option>
          </select>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
            Selection
          </span>

          <div
            className={[
              "flex h-10 items-center",
              "rounded-md px-3",
              "border border-[var(--color-border)]",
              "bg-[var(--color-surface-muted)]",
              "text-sm text-[var(--color-text-secondary)]",
            ].join(" ")}
          >
            {controller.selectionType === OPTION_GROUP_TYPE.SINGLE
              ? "Single selection"
              : "Multiple selection"}
          </div>
        </div>

        <label
          className={[
            "flex items-center gap-3 self-end",
            "rounded-md px-3 py-2.5",
            "border border-[var(--color-border)]",
            "text-sm text-[var(--color-text-secondary)]",
          ].join(" ")}
        >
          <input
            type="checkbox"
            checked={controller.isRequired}
            onChange={(event) => controller.setIsRequired(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          Required
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`option-group-${groupIndex}-minimum`}
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Minimum selections
          </label>

          <Input
            id={`option-group-${groupIndex}-minimum`}
            type="number"
            min={0}
            step={1}
            aria-invalid={Boolean(groupErrors?.minSelect)}
            {...register(`optionGroups.${groupIndex}.minSelect`, {
              valueAsNumber: true,
              required: "Minimum is required.",
              min: {
                value: 0,
                message: "Minimum cannot be negative.",
              },
            })}
          />

          {groupErrors?.minSelect?.message ? (
            <p className="mt-1 text-xs text-[var(--color-danger-strong)]">
              {groupErrors.minSelect.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`option-group-${groupIndex}-maximum`}
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Maximum selections
          </label>

          <Input
            id={`option-group-${groupIndex}-maximum`}
            type="number"
            min={1}
            step={1}
            readOnly={isSizeGroup}
            aria-invalid={Boolean(groupErrors?.maxSelect)}
            className={
              isSizeGroup
                ? [
                    "cursor-not-allowed",
                    "bg-[var(--color-surface-disabled)]",
                    "text-[var(--color-text-muted)]",
                  ].join(" ")
                : undefined
            }
            {...register(`optionGroups.${groupIndex}.maxSelect`, {
              valueAsNumber: true,
              required: "Maximum is required.",
              min: {
                value: 1,
                message: "Maximum must be at least 1.",
              },
            })}
          />

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {isSizeGroup
              ? "Size groups always allow exactly one selection."
              : "Maximum add-ons a customer may select."}
          </p>

          {groupErrors?.maxSelect?.message ? (
            <p className="mt-1 text-xs text-[var(--color-danger-strong)]">
              {groupErrors.maxSelect.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
