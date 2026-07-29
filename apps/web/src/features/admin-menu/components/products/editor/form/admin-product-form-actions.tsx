import { Button } from "@/components/ui/button";

interface AdminProductFormActionsProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
}

export function AdminProductFormActions({
  mode,
  isSubmitting,
  canSubmit,
  onCancel,
}: AdminProductFormActionsProps) {
  const isEditMode = mode === "edit";

  return (
    <footer
      className={[
        "sticky bottom-4 z-10",
        "flex flex-col-reverse gap-3",
        "rounded-xl px-5 py-4",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface-glass)]",
        "backdrop-blur",
        "sm:flex-row sm:items-center",
        "sm:justify-end",
      ].join(" ")}
    >
      <Button
        type="button"
        variant="secondary"
        disabled={isSubmitting}
        onClick={onCancel}
      >
        Cancel
      </Button>

      <Button type="submit" disabled={isSubmitting || !canSubmit}>
        {isSubmitting
          ? "Saving…"
          : isEditMode
            ? "Save changes"
            : "Create product"}
      </Button>
    </footer>
  );
}
