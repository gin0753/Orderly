"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import type { AdminCategoryListItem } from "../../../types/admin-category.types";
import { AdminCategorySortableRow } from "./admin-category-sortable-row";

interface AdminCategoriesReorderListProps {
  categories: AdminCategoryListItem[];
  isSaving: boolean;
  errorMessage: string | null;
  onSave: (categoryIds: string[]) => Promise<void>;
  onCancel: () => void;
}

function sortCategories(categories: AdminCategoryListItem[]) {
  return [...categories].sort(
    (firstCategory, secondCategory) =>
      firstCategory.sortOrder - secondCategory.sortOrder ||
      firstCategory.name.localeCompare(secondCategory.name),
  );
}

function haveSameOrder(firstIds: string[], secondIds: string[]) {
  return (
    firstIds.length === secondIds.length &&
    firstIds.every((id, index) => id === secondIds[index])
  );
}

export function AdminCategoriesReorderList({
  categories,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: AdminCategoriesReorderListProps) {
  const [originalCategoryIds] = useState(() =>
    sortCategories(categories).map((category) => category.id),
  );

  const [orderedCategories, setOrderedCategories] = useState(() =>
    sortCategories(categories),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedCategoryIds = useMemo(
    () => orderedCategories.map((category) => category.id),
    [orderedCategories],
  );

  const hasChanges = !haveSameOrder(originalCategoryIds, orderedCategoryIds);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || isSaving) {
      return;
    }

    setOrderedCategories((currentCategories) => {
      const previousIndex = currentCategories.findIndex(
        (category) => category.id === active.id,
      );

      const nextIndex = currentCategories.findIndex(
        (category) => category.id === over.id,
      );

      if (previousIndex === -1 || nextIndex === -1) {
        return currentCategories;
      }

      return arrayMove(currentCategories, previousIndex, nextIndex);
    });
  }

  async function handleSave() {
    try {
      await onSave(orderedCategoryIds);
    } catch {
      // The mutation error is displayed through errorMessage.
    }
  }

  return (
    <section
      aria-label="Reorder categories"
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div
        className={[
          "border-b border-[var(--color-border)]",
          "bg-[var(--color-notice-background)]",
          "px-5 py-4",
        ].join(" ")}
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Reorder categories
        </h2>

        <p className="mt-1 text-sm text-[var(--color-notice-foreground)]">
          Drag every category into its customer-facing display order. Search and
          filters are temporarily hidden.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedCategoryIds}
          strategy={verticalListSortingStrategy}
        >
          <ol>
            {orderedCategories.map((category, index) => (
              <AdminCategorySortableRow
                key={category.id}
                category={category}
                position={index + 1}
                disabled={isSaving}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {errorMessage ? (
        <div
          role="alert"
          className={[
            "border-t border-[var(--color-danger-border)]",
            "bg-[var(--color-danger-surface)]",
            "px-5 py-4",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-[var(--color-danger-strong)]">
            Category order could not be saved
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <footer
        className={[
          "flex flex-col-reverse gap-3 px-5 py-4",
          "border-t border-[var(--color-border)]",
          "sm:flex-row sm:items-center sm:justify-between",
        ].join(" ")}
      >
        <p
          aria-live="polite"
          className="text-sm text-[var(--color-text-muted)]"
        >
          {isSaving
            ? "Saving category order…"
            : hasChanges
              ? "You have unsaved order changes."
              : "Drag a category to change its position."}
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={!hasChanges || isSaving}
            onClick={() => {
              void handleSave();
            }}
          >
            {isSaving ? "Saving…" : "Save order"}
          </Button>
        </div>
      </footer>
    </section>
  );
}
