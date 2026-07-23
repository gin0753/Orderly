"use client";

import { useState } from "react";

import {
  useArchiveAdminCategory,
  useCreateAdminCategory,
  useUpdateAdminCategory,
  useUpdateAdminCategoryAvailability,
} from "../mutations/use-admin-category-mutations";
import type { AdminCategoryListItem } from "../types/admin-category.types";
import type { AdminCategoryFormValues } from "../components/categories/form/admin-category-form.types";

export type AdminCategoryFormState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      category: AdminCategoryListItem;
    }
  | null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}

export function useAdminCategoryActions() {
  const [categoryForm, setCategoryForm] =
    useState<AdminCategoryFormState>(null);

  const [archiveTarget, setArchiveTarget] =
    useState<AdminCategoryListItem | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createCategoryMutation = useCreateAdminCategory();

  const updateCategoryMutation = useUpdateAdminCategory();

  const updateAvailabilityMutation = useUpdateAdminCategoryAvailability();

  const archiveCategoryMutation = useArchiveAdminCategory();

  const categoryFormIsSubmitting =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const isMutationPending =
    categoryFormIsSubmitting ||
    updateAvailabilityMutation.isPending ||
    archiveCategoryMutation.isPending;

  const pendingCategoryId = updateAvailabilityMutation.isPending
    ? updateAvailabilityMutation.variables?.categoryId
    : archiveCategoryMutation.isPending
      ? archiveCategoryMutation.variables
      : undefined;

  const categoryFormErrorMessage =
    categoryForm?.mode === "create"
      ? getErrorMessage(createCategoryMutation.error)
      : getErrorMessage(updateCategoryMutation.error);

  const availabilityErrorMessage = getErrorMessage(
    updateAvailabilityMutation.error,
  );

  const archiveErrorMessage = getErrorMessage(archiveCategoryMutation.error);

  function clearFeedback() {
    setSuccessMessage(null);
    updateAvailabilityMutation.reset();
  }

  function showSuccessMessage(message: string) {
    setSuccessMessage(message);
  }

  function openCreateCategory() {
    createCategoryMutation.reset();
    updateCategoryMutation.reset();
    updateAvailabilityMutation.reset();

    setSuccessMessage(null);

    setCategoryForm({
      mode: "create",
    });
  }

  function openEditCategory(category: AdminCategoryListItem) {
    createCategoryMutation.reset();
    updateCategoryMutation.reset();
    updateAvailabilityMutation.reset();

    setSuccessMessage(null);

    setCategoryForm({
      mode: "edit",
      category,
    });
  }

  function closeCategoryForm() {
    if (categoryFormIsSubmitting) {
      return;
    }

    createCategoryMutation.reset();
    updateCategoryMutation.reset();
    setCategoryForm(null);
  }

  async function submitCategoryForm(values: AdminCategoryFormValues) {
    if (!categoryForm) {
      return;
    }

    const name = values.name.trim();
    const description = values.description.trim();

    if (categoryForm.mode === "create") {
      await createCategoryMutation.mutateAsync({
        name,
        description: description || undefined,
        isActive: true,
      });

      setCategoryForm(null);

      setSuccessMessage("Category created successfully.");

      return;
    }

    await updateCategoryMutation.mutateAsync({
      categoryId: categoryForm.category.id,
      request: {
        name,
        description: description || null,
      },
    });

    setCategoryForm(null);

    setSuccessMessage("Category updated successfully.");
  }

  async function toggleCategoryAvailability(category: AdminCategoryListItem) {
    updateAvailabilityMutation.reset();
    setSuccessMessage(null);

    try {
      await updateAvailabilityMutation.mutateAsync({
        categoryId: category.id,
        request: {
          isActive: !category.isActive,
        },
      });

      setSuccessMessage(
        category.isActive
          ? `“${category.name}” deactivated successfully.`
          : `“${category.name}” activated successfully.`,
      );
    } catch {
      // The mutation error is exposed through
      // availabilityErrorMessage.
    }
  }

  function openArchiveCategory(category: AdminCategoryListItem) {
    archiveCategoryMutation.reset();
    updateAvailabilityMutation.reset();

    setSuccessMessage(null);
    setArchiveTarget(category);
  }

  function closeArchiveDialog() {
    if (archiveCategoryMutation.isPending) {
      return;
    }

    archiveCategoryMutation.reset();
    setArchiveTarget(null);
  }

  async function confirmArchiveCategory() {
    if (!archiveTarget) {
      return;
    }

    const categoryName = archiveTarget.name;

    await archiveCategoryMutation.mutateAsync(archiveTarget.id);

    setArchiveTarget(null);

    setSuccessMessage(`“${categoryName}” archived successfully.`);
  }

  return {
    categoryForm,
    archiveTarget,
    successMessage,

    pendingCategoryId,
    isMutationPending,

    categoryFormIsSubmitting,
    categoryFormErrorMessage,

    availabilityErrorMessage,

    archiveIsPending: archiveCategoryMutation.isPending,
    archiveErrorMessage,

    clearFeedback,
    showSuccessMessage,

    openCreateCategory,
    openEditCategory,
    closeCategoryForm,
    submitCategoryForm,

    toggleCategoryAvailability,

    openArchiveCategory,
    closeArchiveDialog,
    confirmArchiveCategory,
  };
}
