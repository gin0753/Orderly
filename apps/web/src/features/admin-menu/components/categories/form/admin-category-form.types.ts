export interface AdminCategoryFormErrors {
  name: string | null;
  description: string | null;
}

export interface AdminCategoryFormValues {
  name: string;
  description: string;
}

export interface AdminCategoryFormProps {
  mode: AdminCategoryFormMode;
  initialValues: AdminCategoryFormValues;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: AdminCategoryFormValues) => Promise<void>;
}

export type AdminCategoryFormMode = "create" | "edit";

export const EMPTY_FORM_ERRORS: AdminCategoryFormErrors = {
  name: null,
  description: null,
};

export const EMPTY_ADMIN_CATEGORY_FORM_VALUES: AdminCategoryFormValues = {
  name: "",
  description: "",
};

export const CATEGORY_NAME_MAX_LENGTH = 80;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 240;
