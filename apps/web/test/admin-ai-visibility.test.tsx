/** @jest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";

import { getAdminAiCapability } from "@/features/admin-menu/api/admin-menu-api";
import { AdminProductBasicFields } from "@/features/admin-menu/components/products/editor/form/admin-product-basic-fields";
import type { AdminProductFormValues } from "@/features/admin-menu/types/admin-product-form.types";

jest.mock("@/features/admin-menu/api/admin-menu-api", () => ({
  getAdminAiCapability: jest.fn(),
}));
jest.mock(
  "@/features/admin-menu/mutations/use-admin-content-suggestion",
  () => ({
    useAdminContentSuggestion: () => ({ isPending: false, error: null }),
  }),
);

const capabilityMock = jest.mocked(getAdminAiCapability);
const originalFlag = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;

function Form({ description }: { description: string }) {
  const methods = useForm<AdminProductFormValues>({
    defaultValues: {
      name: "Pizza",
      categoryId: "pizza",
      description,
      basePrice: "14.00",
      imageUrl: "",
      optionGroups: [],
    },
  });
  return (
    <FormProvider {...methods}>
      <AdminProductBasicFields
        categories={[
          { id: "pizza", name: "Pizza", isActive: true, sortOrder: 1 },
        ]}
        isSubmitting={false}
      />
    </FormProvider>
  );
}

function renderForm(description = "") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Form description={description} />
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => {
  if (originalFlag === undefined)
    delete process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;
  else process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = originalFlag;
  jest.resetAllMocks();
});

it("hides AI and makes no capability request when the existing flag is disabled", () => {
  process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = "false";
  renderForm();
  expect(
    screen.queryByRole("button", { name: /with AI/ }),
  ).not.toBeInTheDocument();
  expect(capabilityMock).not.toHaveBeenCalled();
});

it("hides AI while capability is unknown", () => {
  process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = "true";
  capabilityMock.mockReturnValue(new Promise(() => {}));
  renderForm("Existing description");
  expect(
    screen.queryByRole("button", { name: /with AI/ }),
  ).not.toBeInTheDocument();
});

it.each([false, undefined, "true"])(
  "requires explicit boolean availability (%s)",
  async (available) => {
    process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = "true";
    capabilityMock.mockResolvedValue({ available } as { available: boolean });
    const client = renderForm();
    await waitFor(() =>
      expect(
        client.getQueryState(["admin-menu", "ai-capability"])?.status,
      ).toBe("success"),
    );
    expect(
      screen.queryByRole("button", { name: /with AI/ }),
    ).not.toBeInTheDocument();
  },
);

it("hides AI when the capability endpoint fails", async () => {
  process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = "true";
  capabilityMock.mockRejectedValue(new Error("Unavailable"));
  const client = renderForm();
  await waitFor(() =>
    expect(client.getQueryState(["admin-menu", "ai-capability"])?.status).toBe(
      "error",
    ),
  );
  expect(
    screen.queryByRole("button", { name: /with AI/ }),
  ).not.toBeInTheDocument();
});

it("hides a previously available action if capability revalidation fails", async () => {
  process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = "true";
  capabilityMock.mockResolvedValueOnce({ available: true });
  const client = renderForm();
  expect(
    await screen.findByRole("button", { name: "Generate with AI" }),
  ).toBeEnabled();
  capabilityMock.mockRejectedValue(new Error("Unavailable"));
  await act(async () => {
    await client.invalidateQueries({
      queryKey: ["admin-menu", "ai-capability"],
    });
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: /with AI/ }),
    ).not.toBeInTheDocument(),
  );
});

it.each([
  ["", "Generate with AI"],
  ["Existing description", "Improve with AI"],
])(
  "shows the shared create/edit action only after backend confirmation (%s)",
  async (description, label) => {
    process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = "true";
    capabilityMock.mockResolvedValue({ available: true });
    renderForm(description);
    expect(await screen.findByRole("button", { name: label })).toBeEnabled();
  },
);
