"use client";

import type { ButtonHTMLAttributes, RefCallback } from "react";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  OPTION_GROUP_TYPE,
  PRODUCT_OPTION_GROUP_KIND,
  type OptionGroupType,
  type ProductOptionGroupKind,
} from "../../../../types/admin-product.types";

interface AdminProductOptionGroupHeaderProps {
  groupName: string;
  kind: ProductOptionGroupKind;
  selectionType: OptionGroupType;
  isActive: boolean;
  canRemove: boolean;

  dragHandleRef: RefCallback<HTMLButtonElement>;

  dragHandleProps: ButtonHTMLAttributes<HTMLButtonElement>;

  onActiveChange: (isActive: boolean) => void;

  onRemove: () => void;
}

function getKindLabel(kind: ProductOptionGroupKind) {
  switch (kind) {
    case PRODUCT_OPTION_GROUP_KIND.SIZE:
      return "Size";

    case PRODUCT_OPTION_GROUP_KIND.MODIFIER:
      return "Modifier";

    case PRODUCT_OPTION_GROUP_KIND.ADD_ON:
      return "Add-on";
  }
}

function getKindBadgeClassName(kind: ProductOptionGroupKind) {
  switch (kind) {
    case PRODUCT_OPTION_GROUP_KIND.SIZE:
      return [
        "bg-[var(--color-brand-soft)]",
        "text-[var(--color-brand-text)]",
      ].join(" ");

    case PRODUCT_OPTION_GROUP_KIND.MODIFIER:
      return [
        "bg-[var(--color-warning-surface)]",
        "text-[var(--color-warning-strong)]",
      ].join(" ");

    case PRODUCT_OPTION_GROUP_KIND.ADD_ON:
      return [
        "bg-[var(--color-info-surface)]",
        "text-[var(--color-info-strong)]",
      ].join(" ");
  }
}

export function AdminProductOptionGroupHeader({
  groupName,
  kind,
  selectionType,
  isActive,
  canRemove,
  dragHandleRef,
  dragHandleProps,
  onActiveChange,
  onRemove,
}: AdminProductOptionGroupHeaderProps) {
  const displayName = groupName.trim() || "Untitled option group";

  return (
    <header
      className={[
        "border-b border-[var(--color-border)]",
        "bg-[var(--color-surface-muted)]",
        "px-4 py-3",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          ref={dragHandleRef}
          type="button"
          aria-label={`Drag to reorder ${displayName}`}
          className={[
            "inline-flex h-10 w-10 shrink-0",
            "touch-none cursor-grab",
            "items-center justify-center",
            "rounded-md",
            "text-[var(--color-text-muted)]",
            "transition-colors",
            "hover:bg-[var(--color-surface-hover)]",
            "hover:text-[var(--color-text-primary)]",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-[var(--color-ring)]",
            "active:cursor-grabbing",
          ].join(" ")}
          {...dragHandleProps}
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        <p
          className={[
            "min-w-0 flex-1 truncate",
            "text-sm font-semibold",
            "text-[var(--color-text-primary)]",
          ].join(" ")}
        >
          {displayName}
        </p>

        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove unsaved option group"
            className={[
              "shrink-0",
              "text-[var(--color-danger-strong)]",
              "hover:bg-[var(--color-danger-surface)]",
            ].join(" ")}
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : (
          <div aria-hidden="true" className="h-10 w-10 shrink-0" />
        )}
      </div>

      <div
        className={[
          "mt-3 flex flex-wrap",
          "items-center gap-2",
          "pl-[3.25rem]",
        ].join(" ")}
      >
        <span
          className={[
            "shrink-0 rounded-full",
            "px-2 py-1",
            "text-xs font-medium",
            getKindBadgeClassName(kind),
          ].join(" ")}
        >
          {getKindLabel(kind)}
        </span>

        <span
          className={[
            "shrink-0 rounded-full",
            "bg-[var(--color-surface)]",
            "px-2 py-1",
            "text-xs font-medium",
            "text-[var(--color-text-secondary)]",
          ].join(" ")}
        >
          {selectionType === OPTION_GROUP_TYPE.SINGLE ? "Single" : "Multiple"}
        </span>

        <label
          className={[
            "ml-auto flex shrink-0",
            "items-center gap-2",
            "text-sm",
            "text-[var(--color-text-secondary)]",
          ].join(" ")}
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => onActiveChange(event.target.checked)}
            className={["h-4 w-4 shrink-0", "accent-[var(--color-brand)]"].join(
              " ",
            )}
          />
          Active
        </label>
      </div>
    </header>
  );
}
