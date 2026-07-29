"use client";

import {
  FormProvider,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import type { AdminProductCategoryFilterOption } from "../../../../types/admin-product.types";
import { AdminProductBasicFields } from "./admin-product-basic-fields";
import { AdminProductEditorSidebar } from "./admin-product-editor-sidebar";
import { AdminProductFormActions } from "./admin-product-form-actions";
import { AdminProductFormError } from "./admin-product-form-error";

interface AdminProductFormProps {
  mode: "create" | "edit";
  defaultValues: AdminProductFormValues;
  categories: AdminProductCategoryFilterOption[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: AdminProductFormValues) => Promise<void>;
}

export function AdminProductForm({
  mode,
  defaultValues,
  categories,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: AdminProductFormProps) {
  const formMethods = useForm<AdminProductFormValues>({
    defaultValues,
    mode: "onBlur",
  });

  const { handleSubmit, control } = formMethods;

  const [productName, imageUrl] = useWatch({
    control,
    name: ["name", "imageUrl"],
  });

  const submitHandler: SubmitHandler<AdminProductFormValues> = async (
    values,
  ) => {
    try {
      await onSubmit(values);
    } catch {
      // The parent mutation exposes errors through errorMessage.
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form
        noValidate
        onSubmit={handleSubmit(submitHandler)}
        className="space-y-6"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
          <AdminProductBasicFields
            categories={categories}
            isSubmitting={isSubmitting}
          />

          <AdminProductEditorSidebar
            mode={mode}
            productName={productName}
            imageUrl={imageUrl}
          />
        </div>

        <AdminProductFormError message={errorMessage} />

        <AdminProductFormActions
          mode={mode}
          isSubmitting={isSubmitting}
          canSubmit={categories.length > 0}
          onCancel={onCancel}
        />
      </form>
    </FormProvider>
  );
}
