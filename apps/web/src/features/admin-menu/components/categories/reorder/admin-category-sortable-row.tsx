import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CSSProperties } from "react";

import type { AdminCategoryListItem } from "../../../types/admin-category.types";
import { AdminCategoryStatusBadge } from "../admin-category-status-badge";

interface AdminCategorySortableRowProps {
  category: AdminCategoryListItem;
  position: number;
  disabled: boolean;
}

export function AdminCategorySortableRow({
  category,
  position,
  disabled,
}: AdminCategorySortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "relative flex items-center gap-3 px-4 py-4",
        "border-b border-[var(--color-border-soft)]",
        "bg-[var(--color-surface)]",
        "last:border-b-0",
        isDragging ? "opacity-60" : "",
      ].join(" ")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Move ${category.name}`}
        disabled={disabled}
        className={[
          "touch-none rounded-md p-2",
          "cursor-grab active:cursor-grabbing",
          "text-[var(--color-text-muted)]",
          "transition-colors",
          "hover:bg-[var(--color-surface-hover)]",
          "hover:text-[var(--color-text-primary)]",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--color-ring)]",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
        ].join(" ")}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="h-5 w-5" />
      </button>

      <span
        aria-label={`Position ${position}`}
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center",
          "rounded-md",
          "bg-[var(--color-surface-muted)]",
          "text-xs font-semibold",
          "text-[var(--color-text-secondary)]",
        ].join(" ")}
      >
        {position}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {category.name}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs text-[var(--color-text-muted)]">
            {category.slug}
          </span>

          <span className="text-xs text-[var(--color-text-muted)]">
            {category.productCount}{" "}
            {category.productCount === 1 ? "product" : "products"}
          </span>
        </div>
      </div>

      <AdminCategoryStatusBadge isActive={category.isActive} />
    </li>
  );
}
