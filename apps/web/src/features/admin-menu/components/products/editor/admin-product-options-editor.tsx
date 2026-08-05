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
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";

import type { AdminProductFormValues } from "../../../types/admin-product-form.types";
import { PRODUCT_OPTION_GROUP_KIND } from "../../../types/admin-product.types";
import { createEmptyAdminProductOptionGroup } from "../../../utils/admin-product-form.utils";
import { AdminProductOptionGroupCard } from "./option-groups/admin-product-option-group-card";

export function AdminProductOptionsEditor() {
  const {
    control,
    formState: { errors },
  } = useFormContext<AdminProductFormValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "optionGroups",
    keyName: "fieldKey",
  });

  const groups =
    useWatch({
      control,
      name: "optionGroups",
    }) ?? [];

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

  const hasActiveSizeGroup = groups.some(
    (group) => group.kind === PRODUCT_OPTION_GROUP_KIND.SIZE && group.isActive,
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((field) => field.fieldKey === active.id);

    const newIndex = fields.findIndex((field) => field.fieldKey === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    move(oldIndex, newIndex);
  }

  const editorError = errors.root?.optionGroups?.message;

  return (
    <section
      id="product-options-editor"
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <header
        className={[
          "border-b border-[var(--color-border)]",
          "px-5 py-5",
          "sm:px-6",
        ].join(" ")}
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Product options
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Configure sizes, modifiers and add-ons.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={hasActiveSizeGroup}
            className="shrink-0"
            onClick={() =>
              append(
                createEmptyAdminProductOptionGroup(
                  PRODUCT_OPTION_GROUP_KIND.SIZE,
                ),
              )
            }
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Add size
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() =>
              append(
                createEmptyAdminProductOptionGroup(
                  PRODUCT_OPTION_GROUP_KIND.MODIFIER,
                ),
              )
            }
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Add modifier
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() =>
              append(
                createEmptyAdminProductOptionGroup(
                  PRODUCT_OPTION_GROUP_KIND.ADD_ON,
                ),
              )
            }
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Add add-on
          </Button>
        </div>
      </header>

      <div className="space-y-4 p-5 sm:p-6">
        {editorError ? (
          <div
            role="alert"
            className={[
              "rounded-lg px-4 py-3",
              "border border-[var(--color-danger-border)]",
              "bg-[var(--color-danger-surface)]",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-[var(--color-danger-strong)]">
              Option configuration is invalid
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {editorError}
            </p>
          </div>
        ) : null}

        {fields.length > 0 ? (
          <>
            <p className="text-xs text-[var(--color-text-muted)]">
              Drag groups to control their display order.
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((field) => field.fieldKey)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {fields.map((field, groupIndex) => (
                    <AdminProductOptionGroupCard
                      key={field.fieldKey}
                      groupIndex={groupIndex}
                      sortableId={field.fieldKey}
                      canRemove={!field.id}
                      onRemove={() => remove(groupIndex)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <div
            className={[
              "rounded-xl px-6 py-12 text-center",
              "border border-dashed border-[var(--color-border)]",
              "bg-[var(--color-surface-muted)]",
            ].join(" ")}
          >
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              No option groups
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
              Add a size, modifier or add-on group when customers need to
              customize this product.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
