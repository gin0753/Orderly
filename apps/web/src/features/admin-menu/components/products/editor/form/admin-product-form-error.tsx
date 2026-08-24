interface AdminProductFormErrorProps {
  message: string | null;
}

export function AdminProductFormError({ message }: AdminProductFormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={[
        "rounded-lg px-4 py-3",
        "border border-[var(--color-danger-border)]",
        "bg-[var(--color-danger-surface)]",
      ].join(" ")}
    >
      <p className="text-sm font-medium text-[var(--color-danger-strong)]">
        Product could not be saved
      </p>

      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {message}
      </p>
    </div>
  );
}
