import {
  AdminCategoryFormErrors,
  CATEGORY_DESCRIPTION_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
  type AdminCategoryFormValues,
} from "./admin-category-form.types";

export function validateAdminCategoryForm(
  values: AdminCategoryFormValues,
): AdminCategoryFormErrors {
  const name = values.name.trim();
  const description = values.description.trim();

  return {
    name: !name
      ? "Category name is required."
      : name.length > CATEGORY_NAME_MAX_LENGTH
        ? `Category name must be ${CATEGORY_NAME_MAX_LENGTH} characters or fewer.`
        : null,

    description:
      description.length > CATEGORY_DESCRIPTION_MAX_LENGTH
        ? `Description must be ${CATEGORY_DESCRIPTION_MAX_LENGTH} characters or fewer.`
        : null,
  };
}

export function hasAdminCategoryFormErrors(errors: AdminCategoryFormErrors) {
  return Boolean(errors.name || errors.description);
}
