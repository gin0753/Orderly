"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import type { OptionGroupType } from "../../../../types/admin-product.types";
import { createEmptyAdminProductOption } from "../../../../utils/admin-product-form.utils";
import { AdminProductOptionRow } from "./admin-product-option-row";

interface AdminProductOptionListProps {
  groupIndex: number;
  selectionType: OptionGroupType;
  minimumRequired: number;

  onSetDefault: (optionIndex: number, isDefault: boolean) => void;
}

export function AdminProductOptionList({
  groupIndex,
  selectionType,
  minimumRequired,
  onSetDefault,
}: AdminProductOptionListProps) {
  const { control } = useFormContext<AdminProductFormValues>();

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    move: moveOption,
  } = useFieldArray({
    control,
    name: `optionGroups.${groupIndex}.options`,
    keyName: "fieldKey",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleAddOption() {
    const shouldBeDefault =
      selectionType === "SINGLE" &&
      minimumRequired > 0 &&
      optionFields.length === 0;

    appendOption(createEmptyAdminProductOption(shouldBeDefault));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const previousIndex = optionFields.findIndex(
      (field) => field.fieldKey === active.id,
    );

    const nextIndex = optionFields.findIndex(
      (field) => field.fieldKey === over.id,
    );

    if (previousIndex < 0 || nextIndex < 0) {
      return;
    }

    moveOption(previousIndex, nextIndex);
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Options
          </h3>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Drag options to control their customer-facing order.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddOption}
        >
          <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
          Add option
        </Button>
      </div>

      {optionFields.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={optionFields.map((field) => field.fieldKey)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {optionFields.map((optionField, optionIndex) => (
                <AdminProductOptionRow
                  key={optionField.fieldKey}
                  groupIndex={groupIndex}
                  optionIndex={optionIndex}
                  sortableId={optionField.fieldKey}
                  selectionType={selectionType}
                  canRemove={!optionField.id}
                  onRemove={() => removeOption(optionIndex)}
                  onSetDefault={onSetDefault}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div
          className={[
            "rounded-lg px-4 py-8",
            "text-center",
            "border border-dashed border-[var(--color-border)]",
            "bg-[var(--color-surface-muted)]",
          ].join(" ")}
        >
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            No options yet
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Add an option to configure this group.
          </p>
        </div>
      )}
    </section>
  );
}
