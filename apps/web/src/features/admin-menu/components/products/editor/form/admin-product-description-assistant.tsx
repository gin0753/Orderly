"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useAdminContentSuggestion } from "../../../../mutations/use-admin-content-suggestion";
import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import type {
  AdminContentSuggestionRequest,
  AdminProductCategoryFilterOption,
} from "../../../../types/admin-product.types";

interface AdminProductDescriptionAssistantProps {
  categories: AdminProductCategoryFilterOption[];
  isSubmitting: boolean;
}

type SuggestionState = {
  description: string;
  contextKey: string;
};

function createRequestContext(
  name: string,
  categoryName: string,
  description: string,
): AdminContentSuggestionRequest {
  const normalizedDescription = description.trim();

  return {
    name: name.trim(),
    categoryName: categoryName.trim(),
    ...(normalizedDescription
      ? { description: normalizedDescription }
      : {}),
  };
}

function createContextKey(context: AdminContentSuggestionRequest) {
  return JSON.stringify(context);
}

export function AdminProductDescriptionAssistant({
  categories,
  isSubmitting,
}: AdminProductDescriptionAssistantProps) {
  const { control, setValue } = useFormContext<AdminProductFormValues>();
  const [name, categoryId, description] = useWatch({
    control,
    name: ["name", "categoryId", "description"],
  });
  const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
  const suggestionMutation = useAdminContentSuggestion();

  const category = useMemo(
    () => categories.find((item) => item.id === categoryId),
    [categories, categoryId],
  );
  const currentContextKey = category
    ? createContextKey(createRequestContext(name, category.name, description))
    : null;
  const currentSuggestion =
    suggestion?.contextKey === currentContextKey ? suggestion : null;
  const canGenerate = Boolean(name.trim() && category);
  const hasDescription = Boolean(description.trim());
  const errorMessage =
    suggestionMutation.error instanceof Error
      ? suggestionMutation.error.message
      : null;

  async function generateSuggestion() {
    if (!category || !name.trim()) {
      return;
    }

    setSuggestion(null);

    const requestContext = createRequestContext(
      name,
      category.name,
      description,
    );
    const contextKey = createContextKey(requestContext);
    try {
      const response = await suggestionMutation.mutateAsync(requestContext);

      setSuggestion({
        description: response.description,
        contextKey,
      });
    } catch {
      // The mutation error is rendered without affecting the product form.
    }
  }

  function applySuggestion() {
    if (!currentSuggestion) {
      return;
    }

    setValue("description", currentSuggestion.description, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setSuggestion(null);
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="brandSoft"
          disabled={
            isSubmitting || suggestionMutation.isPending || !canGenerate
          }
          onClick={() => {
            void generateSuggestion();
          }}
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {suggestionMutation.isPending
            ? "Generating…"
            : hasDescription
              ? "Improve with AI"
              : "Generate with AI"}
        </Button>

        {!canGenerate ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            Add a product name and category first.
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-4 py-3"
        >
          <p className="text-sm font-medium text-[var(--color-danger-strong)]">
            AI suggestion could not be generated
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {currentSuggestion ? (
        <Card
          role="status"
          aria-live="polite"
          className="rounded-xl p-4 shadow-none"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-text)]">
            AI suggestion
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">
            {currentSuggestion.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applySuggestion}>
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSuggestion(null)}
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isSubmitting || suggestionMutation.isPending}
              onClick={() => {
                void generateSuggestion();
              }}
            >
              Regenerate
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
