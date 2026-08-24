"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import {
  OPTION_GROUP_TYPE,
  PRODUCT_OPTION_GROUP_KIND,
  type OptionGroupType,
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

  const isSingleSelection =
    controller.selectionType === OPTION_GROUP_TYPE.SINGLE;

  function handleKindChange(value: string) {
    if (
      value !== PRODUCT_OPTION_GROUP_KIND.SIZE &&
      value !== PRODUCT_OPTION_GROUP_KIND.MODIFIER &&
      value !== PRODUCT_OPTION_GROUP_KIND.ADD_ON
    ) {
      return;
    }

    controller.changeKind(value as ProductOptionGroupKind);
  }

  function handleSelectionTypeChange(value: string) {
    if (
      value !== OPTION_GROUP_TYPE.SINGLE &&
      value !== OPTION_GROUP_TYPE.MULTIPLE
    ) {
      return;
    }

    controller.changeSelectionType(value as OptionGroupType);
  }

  return (
    <div className="space-y-5">
      <div
        className={[
          "grid gap-4",
          "[grid-template-columns:repeat(auto-fit,minmax(min(100%,10.5rem),1fr))]",
        ].join(" ")}
      >
        <div className="min-w-0">
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
            className="min-w-0"
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

        <div className="min-w-0">
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
              "h-10 w-full min-w-0 rounded-md px-3",
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

            <option value={PRODUCT_OPTION_GROUP_KIND.MODIFIER}>Modifier</option>

            <option value={PRODUCT_OPTION_GROUP_KIND.ADD_ON}>Add-on</option>
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`option-group-${groupIndex}-type`}
            className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Selection
          </label>

          <select
            id={`option-group-${groupIndex}-type`}
            value={controller.selectionType}
            disabled={isSizeGroup}
            onChange={(event) => handleSelectionTypeChange(event.target.value)}
            className={[
              "h-10 w-full min-w-0 rounded-md px-3",
              "border border-[var(--color-border)]",
              "text-sm",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--color-ring)]",
              isSizeGroup
                ? [
                    "cursor-not-allowed",
                    "bg-[var(--color-surface-disabled)]",
                    "text-[var(--color-text-muted)]",
                  ].join(" ")
                : [
                    "bg-[var(--color-surface)]",
                    "text-[var(--color-text-primary)]",
                    "transition-colors",
                    "hover:border-[var(--color-border-hover)]",
                  ].join(" "),
            ].join(" ")}
          >
            <option value={OPTION_GROUP_TYPE.SINGLE}>Single</option>

            <option value={OPTION_GROUP_TYPE.MULTIPLE}>Multiple</option>
          </select>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {isSizeGroup
              ? "Size groups always use single selection."
              : isSingleSelection
                ? "Customers may select one option."
                : "Customers may select multiple options."}
          </p>
        </div>

        <label
          className={[
            "flex min-h-10 min-w-0 items-center gap-3",
            "self-end rounded-md px-3 py-2",
            "border border-[var(--color-border)]",
            "text-sm text-[var(--color-text-secondary)]",
          ].join(" ")}
        >
          <input
            type="checkbox"
            checked={controller.isRequired}
            onChange={(event) => controller.setIsRequired(event.target.checked)}
            className="h-4 w-4 shrink-0 accent-[var(--color-brand)]"
          />

          <span className="min-w-0">Required</span>
        </label>
      </div>

      <div
        className={[
          "grid gap-4",
          "[grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]",
        ].join(" ")}
      >
        <div className="min-w-0">
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
            className="min-w-0"
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

        <div className="min-w-0">
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
            readOnly={isSingleSelection}
            aria-invalid={Boolean(groupErrors?.maxSelect)}
            className={[
              "min-w-0",
              isSingleSelection
                ? [
                    "cursor-not-allowed",
                    "bg-[var(--color-surface-disabled)]",
                    "text-[var(--color-text-muted)]",
                  ].join(" ")
                : "",
            ].join(" ")}
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
            {isSingleSelection
              ? "Single-selection groups always have a maximum of 1."
              : "Maximum number of options a customer may select."}
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
