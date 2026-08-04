"use client";

import type { ButtonHTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { AdminProductOptionGroupHeader } from "./admin-product-option-group-header";
import { AdminProductOptionGroupSettings } from "./admin-product-option-group-settings";
import { AdminProductOptionList } from "./admin-product-option-list";
import { useAdminProductOptionGroup } from "./use-admin-product-option-group";

interface AdminProductOptionGroupCardProps {
  groupIndex: number;
  sortableId: string;
  canRemove: boolean;
  onRemove: () => void;
}

export function AdminProductOptionGroupCard({
  groupIndex,
  sortableId,
  canRemove,
  onRemove,
}: AdminProductOptionGroupCardProps) {
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

  const controller = useAdminProductOptionGroup(groupIndex);

  const dragHandleProps: ButtonHTMLAttributes<HTMLButtonElement> = {
    ...attributes,
    ...(listeners ?? {}),
  };

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        isDragging ? "relative z-20 opacity-70" : "",
        controller.isActive ? "" : "opacity-75",
      ].join(" ")}
    >
      <AdminProductOptionGroupHeader
        groupName={controller.groupName}
        kind={controller.kind}
        selectionType={controller.selectionType}
        isActive={controller.isActive}
        canRemove={canRemove}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={dragHandleProps}
        onActiveChange={controller.setIsActive}
        onRemove={onRemove}
      />

      <div className="space-y-6 p-5">
        <AdminProductOptionGroupSettings
          groupIndex={groupIndex}
          controller={controller}
        />

        <AdminProductOptionList
          groupIndex={groupIndex}
          selectionType={controller.selectionType}
          minimumRequired={controller.minimumRequired}
          onSetDefault={controller.setDefaultOption}
        />
      </div>
    </article>
  );
}
