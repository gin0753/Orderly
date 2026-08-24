interface AdminCategoryStatusBadgeProps {
  isActive: boolean;
  isArchived: boolean;
}

export function AdminCategoryStatusBadge({
  isActive,
  isArchived,
}: AdminCategoryStatusBadgeProps) {
  if (isArchived) {
    return (
      <span
        className={[
          "inline-flex rounded-full border px-2.5 py-1",
          "text-xs font-medium",
          "border-[var(--color-border)]",
          "bg-[var(--color-surface-muted)]",
          "text-[var(--color-text-secondary)]",
        ].join(" ")}
      >
        Archived
      </span>
    );
  }

  if (isActive) {
    return (
      <span
        className={[
          "inline-flex rounded-full border px-2.5 py-1",
          "text-xs font-medium",
          "border-[var(--color-success-border)]",
          "bg-[var(--color-success-surface)]",
          "text-[var(--color-success-strong)]",
        ].join(" ")}
      >
        Active
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1",
        "text-xs font-medium",
        "border-[var(--color-warning-border)]",
        "bg-[var(--color-warning-surface)]",
        "text-[var(--color-warning-strong)]",
      ].join(" ")}
    >
      Inactive
    </span>
  );
}
