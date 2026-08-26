/** @jest-environment jsdom */

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { AdminProductDescriptionAssistant } from "@/features/admin-menu/components/products/editor/form/admin-product-description-assistant";
import type { AdminProductFormValues } from "@/features/admin-menu/types/admin-product-form.types";

const useAdminContentSuggestionMock = jest.fn();

jest.mock(
  "@/features/admin-menu/mutations/use-admin-content-suggestion",
  () => ({
    useAdminContentSuggestion: () => useAdminContentSuggestionMock(),
  }),
);

const categories = [
  { id: "pizza", name: "Pizza", isActive: true, sortOrder: 1 },
  { id: "pasta", name: "Pasta", isActive: true, sortOrder: 2 },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function useFailingSuggestion() {
  const [error, setError] = useState<Error | null>(null);

  return {
    isPending: false,
    error,
    mutateAsync: async () => {
      const nextError = new Error("Service temporarily unavailable.");
      setError(nextError);
      throw nextError;
    },
  };
}

function FormHarness({
  name = "",
  categoryId = "",
  description = "",
}: Partial<Pick<AdminProductFormValues, "name" | "categoryId" | "description">>) {
  const methods = useForm<AdminProductFormValues>({
    defaultValues: {
      name,
      categoryId,
      description,
      basePrice: "14.00",
      imageUrl: "",
      optionGroups: [],
    },
  });

  return (
    <FormProvider {...methods}>
      <label htmlFor="name">Product name</label>
      <input id="name" {...methods.register("name")} />
      <label htmlFor="category">Category</label>
      <select id="category" {...methods.register("categoryId")}>
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <label htmlFor="description">Description</label>
      <textarea id="description" {...methods.register("description")} />
      <AdminProductDescriptionAssistant
        categories={categories}
        isSubmitting={false}
      />
    </FormProvider>
  );
}

describe("AdminProductDescriptionAssistant", () => {
  const mutateAsync = jest.fn();

  beforeEach(() => {
    useAdminContentSuggestionMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });
  });

  it("requires a product name and category before generation", () => {
    render(<FormHarness />);

    expect(screen.getByRole("button", { name: "Generate with AI" })).toBeDisabled();
    expect(
      screen.getByText("Add a product name and category first."),
    ).toBeInTheDocument();
  });

  it("shows the current-context suggestion and applies it only on request", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValueOnce({ description: "A crisp, bright favourite." });
    render(
      <FormHarness
        name="  Margherita  "
        categoryId="pizza"
        description="  Original copy.  "
      />,
    );

    await user.click(screen.getByRole("button", { name: "Improve with AI" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      name: "Margherita",
      categoryName: "Pizza",
      description: "Original copy.",
    });
    const suggestion = await screen.findByRole("status");
    expect(suggestion).toHaveTextContent("A crisp, bright favourite.");
    expect(screen.getByLabelText("Description")).toHaveValue("  Original copy.  ");

    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByLabelText("Description")).toHaveValue(
      "A crisp, bright favourite.",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not present a response after its form context becomes stale", async () => {
    const user = userEvent.setup();
    const response = deferred<{ description: string }>();
    mutateAsync.mockReturnValueOnce(response.promise);
    render(<FormHarness name="Margherita" categoryId="pizza" />);

    await user.click(screen.getByRole("button", { name: "Generate with AI" }));
    await user.clear(screen.getByLabelText("Product name"));
    await user.type(screen.getByLabelText("Product name"), "Pepperoni");

    await act(async () => {
      response.resolve({ description: "Suggestion for Margherita." });
      await response.promise;
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("");
  });

  it("discards a suggestion and regenerates using the unchanged context", async () => {
    const user = userEvent.setup();
    mutateAsync
      .mockResolvedValueOnce({ description: "First suggestion." })
      .mockResolvedValueOnce({ description: "Second suggestion." });
    render(<FormHarness name="Margherita" categoryId="pizza" />);

    await user.click(screen.getByRole("button", { name: "Generate with AI" }));
    await screen.findByText("First suggestion.");
    await user.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(await screen.findByText("Second suggestion.")).toBeInTheDocument();
    expect(mutateAsync).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces API failure without preventing manual description edits", async () => {
    const user = userEvent.setup();
    useAdminContentSuggestionMock.mockImplementation(useFailingSuggestion);
    render(
      <FormHarness
        name="Margherita"
        categoryId="pizza"
        description="Manual copy"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Improve with AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service temporarily unavailable.",
    );
    await user.type(screen.getByLabelText("Description"), " remains editable");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Manual copy remains editable",
    );
  });
});
