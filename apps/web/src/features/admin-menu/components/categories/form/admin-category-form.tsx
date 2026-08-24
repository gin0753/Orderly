"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  AdminCategoryFormErrors,
  AdminCategoryFormProps,
  CATEGORY_DESCRIPTION_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
  EMPTY_FORM_ERRORS,
  type AdminCategoryFormValues,
} from "./admin-category-form.types";
import {
  hasAdminCategoryFormErrors,
  validateAdminCategoryForm,
} from "./admin-category-form-validation";

export function AdminCategoryForm({
  mode,
  initialValues,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: AdminCategoryFormProps) {
  const nameInputId = useId();
  const nameErrorId = useId();
  const descriptionInputId = useId();
  const descriptionErrorId = useId();

  const [values, setValues] = useState<AdminCategoryFormValues>(initialValues);

  const [errors, setErrors] =
    useState<AdminCategoryFormErrors>(EMPTY_FORM_ERRORS);

  const isEditMode = mode === "edit";

  function updateName(name: string) {
    setValues((currentValues) => ({
      ...currentValues,
      name,
    }));

    if (errors.name) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        name: null,
      }));
    }
  }

  function updateDescription(description: string) {
    setValues((currentValues) => ({
      ...currentValues,
      description,
    }));

    if (errors.description) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        description: null,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateAdminCategoryForm(values);

    setErrors(nextErrors);

    if (hasAdminCategoryFormErrors(nextErrors)) {
      return;
    }

    const normalizedValues: AdminCategoryFormValues = {
      name: values.name.trim(),
      description: values.description.trim(),
    };

    try {
      await onSubmit(normalizedValues);
    } catch {
      // The parent mutation exposes its error through errorMessage.
    }
  }

  return (
    <form
      id="admin-category-form"
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div>
          <label
            htmlFor={nameInputId}
            className={[
              "mb-2 block text-sm font-medium",
              "text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            Name
            <span
              aria-hidden="true"
              className="ml-1 text-[var(--color-danger)]"
            >
              *
            </span>
          </label>

          <Input
            id={nameInputId}
            autoFocus
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            value={values.name}
            placeholder="e.g. Pizza"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? nameErrorId : undefined}
            disabled={isSubmitting}
            onChange={(event) => {
              updateName(event.target.value);
            }}
          />

          <div className="mt-2 flex min-h-5 items-start justify-between gap-4">
            <div>
              {errors.name ? (
                <p
                  id={nameErrorId}
                  className="text-sm text-[var(--color-danger-strong)]"
                >
                  {errors.name}
                </p>
              ) : null}
            </div>

            <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
              {values.name.length}/{CATEGORY_NAME_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor={descriptionInputId}
            className={[
              "mb-2 block text-sm font-medium",
              "text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            Description
          </label>

          <textarea
            id={descriptionInputId}
            rows={5}
            maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
            value={values.description}
            placeholder="Describe the products in this category."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? descriptionErrorId : undefined
            }
            disabled={isSubmitting}
            onChange={(event) => {
              updateDescription(event.target.value);
            }}
            className={[
              "w-full resize-y rounded-md px-3 py-2",
              "border border-[var(--color-border)]",
              "bg-[var(--color-surface)]",
              "text-sm text-[var(--color-text-primary)]",
              "placeholder:text-[var(--color-text-subtle)]",
              "transition-colors",
              "hover:border-[var(--color-border-hover)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--color-ring)]",
              "disabled:cursor-not-allowed",
              "disabled:bg-[var(--color-surface-disabled)]",
              "disabled:text-[var(--color-text-muted)]",
            ].join(" ")}
          />

          <div className="mt-2 flex min-h-5 items-start justify-between gap-4">
            <div>
              {errors.description ? (
                <p
                  id={descriptionErrorId}
                  className="text-sm text-[var(--color-danger-strong)]"
                >
                  {errors.description}
                </p>
              ) : null}
            </div>

            <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
              {values.description.length}/{CATEGORY_DESCRIPTION_MAX_LENGTH}
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className={[
              "rounded-lg px-4 py-3",
              "border border-[var(--color-danger-border)]",
              "bg-[var(--color-danger-surface)]",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-[var(--color-danger-strong)]">
              Category could not be saved
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {errorMessage}
            </p>
          </div>
        ) : null}
      </div>

      <footer
        className={[
          "flex justify-end gap-3",
          "border-t border-[var(--color-border)]",
          "px-6 py-4",
        ].join(" ")}
      >
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : isEditMode
              ? "Save changes"
              : "Create category"}
        </Button>
      </footer>
    </form>
  );
}
