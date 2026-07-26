"use client";

import { useState } from "react";

import type { AdminCategoryFormValues } from "../components/categories/form/admin-category-form.types";
import {
  useArchiveAdminCategory,
  useCreateAdminCategory,
  useRestoreAdminCategory,
  useUpdateAdminCategory,
  useUpdateAdminCategoryAvailability,
} from "../mutations/use-admin-category-mutations";
import type { AdminCategoryListItem } from "../types/admin-category.types";

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

  const restoreCategoryMutation = useRestoreAdminCategory();

  const categoryFormIsSubmitting =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const isMutationPending =
    categoryFormIsSubmitting ||
    updateAvailabilityMutation.isPending ||
    archiveCategoryMutation.isPending ||
    restoreCategoryMutation.isPending;

  const pendingCategoryId = updateAvailabilityMutation.isPending
    ? updateAvailabilityMutation.variables?.categoryId
    : archiveCategoryMutation.isPending
      ? archiveCategoryMutation.variables
      : restoreCategoryMutation.isPending
        ? restoreCategoryMutation.variables
        : undefined;

  const categoryFormErrorMessage =
    categoryForm?.mode === "create"
      ? getErrorMessage(createCategoryMutation.error)
      : categoryForm?.mode === "edit"
        ? getErrorMessage(updateCategoryMutation.error)
        : null;

  const availabilityErrorMessage = getErrorMessage(
    updateAvailabilityMutation.error,
  );

  const archiveErrorMessage = getErrorMessage(archiveCategoryMutation.error);

  const restoreErrorMessage = getErrorMessage(restoreCategoryMutation.error);

  function resetRowActionMutations() {
    updateAvailabilityMutation.reset();
    archiveCategoryMutation.reset();
    restoreCategoryMutation.reset();
  }

  function clearFeedback() {
    setSuccessMessage(null);
    resetRowActionMutations();
  }

  function showSuccessMessage(message: string) {
    setSuccessMessage(message);
  }

  function openCreateCategory() {
    createCategoryMutation.reset();
    updateCategoryMutation.reset();
    resetRowActionMutations();

    setSuccessMessage(null);

    setCategoryForm({
      mode: "create",
    });
  }

  function openEditCategory(category: AdminCategoryListItem) {
    createCategoryMutation.reset();
    updateCategoryMutation.reset();
    resetRowActionMutations();

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
    resetRowActionMutations();
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
      // Error is exposed through
      // availabilityErrorMessage.
    }
  }

  function openArchiveCategory(category: AdminCategoryListItem) {
    resetRowActionMutations();
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

    try {
      await archiveCategoryMutation.mutateAsync(archiveTarget.id);

      setArchiveTarget(null);

      setSuccessMessage(`“${categoryName}” archived successfully.`);
    } catch {
      // Keep the dialog open.
      // Error is exposed through
      // archiveErrorMessage.
    }
  }

  async function restoreCategory(category: AdminCategoryListItem) {
    resetRowActionMutations();
    setSuccessMessage(null);

    try {
      await restoreCategoryMutation.mutateAsync(category.id);

      setSuccessMessage(`“${category.name}” was restored as inactive.`);
    } catch {
      // Error is exposed through
      // restoreErrorMessage.
    }
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

    restoreErrorMessage,

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

    restoreCategory,
  };
}
