/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { AdminCategoryFormDialog } from "@/features/admin-menu/components/categories/form/admin-category-form-dialog";
import { AdminProductEditorError } from "@/features/admin-menu/components/products/editor/admin-product-editor-state";
import { AdminOrdersLoadErrorState } from "@/features/admin-orders/components/feedback/admin-orders-error-states";

it("announces initial Admin order load failures", () => {
  render(
    <AdminOrdersLoadErrorState
      message="Orders are unavailable."
      isRetrying={false}
      onRetry={jest.fn()}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Unable to load orders",
  );
});

it("renders an explicit announced unavailable product-editor state", () => {
  render(
    <AdminProductEditorError
      title="Product unavailable"
      message="This product could not be found or is no longer available."
      onBack={jest.fn()}
      onRetry={jest.fn()}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Product unavailable");
  expect(
    screen.getByRole("button", { name: "Back to products" }),
  ).toBeInTheDocument();
});

it("gives the Admin category dialog close control a 44px target", () => {
  render(
    <AdminCategoryFormDialog
      mode="create"
      isSubmitting={false}
      errorMessage={null}
      onClose={jest.fn()}
      onSubmit={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  expect(
    screen.getByRole("button", { name: "Close category form" }),
  ).toHaveClass("size-11");
});
