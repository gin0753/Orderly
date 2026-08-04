"use client";

import { useController, useFormContext } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import {
  OPTION_GROUP_TYPE,
  type OptionGroupType,
} from "../../../../types/admin-product.types";
import { parsePriceAdjustmentToCents } from "../../../../utils/admin-product-form.utils";

interface AdminProductOptionRowProps {
  groupIndex: number;
  optionIndex: number;
  sortableId: string;
  selectionType: OptionGroupType;
  canRemove: boolean;
  onRemove: () => void;
  onSetDefault: (optionIndex: number, isDefault: boolean) => void;
}

export function AdminProductOptionRow({
  groupIndex,
  optionIndex,
  sortableId,
  selectionType,
  canRemove,
  onRemove,
  onSetDefault,
}: AdminProductOptionRowProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<AdminProductFormValues>();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
  });

  const availableFieldName =
    `optionGroups.${groupIndex}.options.${optionIndex}.isAvailable` as const;

  const defaultFieldName =
    `optionGroups.${groupIndex}.options.${optionIndex}.isDefault` as const;

  const {
    field: {
      value: availableValue,
      onChange: onAvailableChange,
      onBlur: onAvailableBlur,
    },
  } = useController({
    control,
    name: availableFieldName,
  });

  const {
    field: {
      value: defaultValue,
      onChange: onDefaultChange,
      onBlur: onDefaultBlur,
    },
  } = useController({
    control,
    name: defaultFieldName,
  });

  const optionErrors =
    errors.optionGroups?.[groupIndex]?.options?.[optionIndex];

  const isAvailable = Boolean(availableValue);

  const defaultDisabled =
    selectionType === OPTION_GROUP_TYPE.MULTIPLE || !isAvailable;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "grid gap-3 rounded-lg p-3",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        "lg:grid-cols-[auto_minmax(10rem,1fr)_10rem_auto_auto_auto]",
        "lg:items-start",
        isDragging ? "relative z-10 opacity-70" : "",
        isAvailable ? "" : "opacity-70",
      ].join(" ")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder option"
        className={[
          "inline-flex h-10 w-10 shrink-0 touch-none",
          "cursor-grab items-center justify-center rounded-md",
          "text-[var(--color-text-muted)]",
          "transition-colors",
          "hover:bg-[var(--color-surface-hover)]",
          "hover:text-[var(--color-text-primary)]",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--color-ring)]",
          "active:cursor-grabbing",
        ].join(" ")}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="h-4 w-4" />
      </button>

      <div>
        <label
          htmlFor={`option-${groupIndex}-${optionIndex}-name`}
          className="sr-only"
        >
          Option name
        </label>

        <Input
          id={`option-${groupIndex}-${optionIndex}-name`}
          placeholder="Option name"
          aria-invalid={Boolean(optionErrors?.name)}
          {...register(
            `optionGroups.${groupIndex}.options.${optionIndex}.name`,
            {
              validate: (value) =>
                value.trim().length > 0 || "Option name is required.",
            },
          )}
        />

        {optionErrors?.name?.message ? (
          <p className="mt-1 text-xs text-[var(--color-danger-strong)]">
            {optionErrors.name.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`option-${groupIndex}-${optionIndex}-price`}
          className="sr-only"
        >
          Price adjustment
        </label>

        <Input
          id={`option-${groupIndex}-${optionIndex}-price`}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          aria-invalid={Boolean(optionErrors?.priceDelta)}
          {...register(
            `optionGroups.${groupIndex}.options.${optionIndex}.priceDelta`,
            {
              validate: (value) =>
                parsePriceAdjustmentToCents(value) !== null ||
                "Invalid price adjustment.",
            },
          )}
        />

        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          AUD adjustment
        </p>

        {optionErrors?.priceDelta?.message ? (
          <p className="mt-1 text-xs text-[var(--color-danger-strong)]">
            {optionErrors.priceDelta.message}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 pt-2 text-sm text-[var(--color-text-secondary)]">
        <input
          type="checkbox"
          name={availableFieldName}
          checked={isAvailable}
          onBlur={onAvailableBlur}
          onChange={(event) => {
            const nextIsAvailable = event.target.checked;

            onAvailableChange(nextIsAvailable);

            if (!nextIsAvailable) {
              onDefaultChange(false);
            }
          }}
          className="h-4 w-4 accent-[var(--color-brand)]"
        />
        Available
      </label>

      <label
        className={[
          "flex items-center gap-2 pt-2 text-sm",
          defaultDisabled
            ? "text-[var(--color-text-disabled)]"
            : "text-[var(--color-text-secondary)]",
        ].join(" ")}
      >
        <input
          type="checkbox"
          name={defaultFieldName}
          checked={Boolean(defaultValue)}
          disabled={defaultDisabled}
          onBlur={onDefaultBlur}
          onChange={(event) => onSetDefault(optionIndex, event.target.checked)}
          className="h-4 w-4 accent-[var(--color-brand)]"
        />
        Default
      </label>

      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove unsaved option"
          className={[
            "text-[var(--color-danger-strong)]",
            "hover:bg-[var(--color-danger-surface)]",
          ].join(" ")}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : (
        <div className="h-10 w-10" aria-hidden="true" />
      )}
    </div>
  );
}
