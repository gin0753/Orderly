"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

import { AdminCategoryForm } from "./admin-category-form";
import {
  EMPTY_ADMIN_CATEGORY_FORM_VALUES,
  type AdminCategoryFormMode,
  type AdminCategoryFormValues,
} from "./admin-category-form.types";

interface AdminCategoryFormDialogProps {
  mode: AdminCategoryFormMode;
  initialValues?: AdminCategoryFormValues;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (values: AdminCategoryFormValues) => Promise<void>;
}

export function AdminCategoryFormDialog({
  mode,
  initialValues = EMPTY_ADMIN_CATEGORY_FORM_VALUES,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: AdminCategoryFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.showModal();

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();

    if (!isSubmitting) {
      onClose();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  }

  const isEditMode = mode === "edit";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={[
        "m-0 ml-auto h-dvh max-h-none",
        "w-full max-w-md p-0",
        "bg-transparent",
        "backdrop:bg-[var(--color-overlay)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-full flex-col",
          "border-l border-[var(--color-border)]",
          "bg-[var(--color-surface)]",
        ].join(" ")}
      >
        <header
          className={[
            "flex items-start justify-between gap-4",
            "border-b border-[var(--color-border)]",
            "px-6 py-5",
          ].join(" ")}
        >
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--color-text-primary)]"
            >
              {isEditMode ? "Edit category" : "Add category"}
            </h2>

            <p
              id={descriptionId}
              className="mt-1 text-sm text-[var(--color-text-muted)]"
            >
              {isEditMode
                ? "Update this menu category."
                : "Create a new menu category."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close category form"
            disabled={isSubmitting}
            onClick={onClose}
            className={[
              "rounded-md px-2 py-1",
              "text-lg leading-none",
              "text-[var(--color-text-muted)]",
              "transition-colors",
              "hover:bg-[var(--color-surface-hover)]",
              "hover:text-[var(--color-text-primary)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--color-ring)]",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
              "cursor-pointer",
            ].join(" ")}
          >
            ×
          </button>
        </header>

        <AdminCategoryForm
          mode={mode}
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </dialog>
  );
}
