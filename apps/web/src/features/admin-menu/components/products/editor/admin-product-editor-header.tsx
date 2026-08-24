import { Button } from "@/components/ui/button";

interface AdminProductEditorHeaderProps {
  mode: "create" | "edit";
  productName?: string;
  isAvailable?: boolean;
  onBack: () => void;
}

export function AdminProductEditorHeader({
  mode,
  productName,
  isAvailable,
  onBack,
}: AdminProductEditorHeaderProps) {
  const isEditMode = mode === "edit";

  return (
    <header className="space-y-4">
      <Button type="button" variant="secondary" size="sm" onClick={onBack}>
        ← Back to products
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {isEditMode ? "Edit product" : "Add product"}
          </h1>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {isEditMode
              ? productName || "Update this menu product."
              : "Create a new product and assign it to a menu category."}
          </p>
        </div>

        {isEditMode && isAvailable !== undefined ? (
          <span
            className={[
              "inline-flex w-fit rounded-full",
              "px-2.5 py-1 text-xs font-medium",
              isAvailable
                ? [
                    "bg-[var(--color-success-surface)]",
                    "text-[var(--color-success-strong)]",
                  ].join(" ")
                : [
                    "bg-[var(--color-warning-surface)]",
                    "text-[var(--color-warning-strong)]",
                  ].join(" "),
            ].join(" ")}
          >
            {isAvailable ? "Available" : "Unavailable"}
          </span>
        ) : null}
      </div>
    </header>
  );
}
