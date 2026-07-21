interface AdminCategoryStatusBadgeProps {
  isActive: boolean;
}

export function AdminCategoryStatusBadge({
  isActive,
}: AdminCategoryStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-1",
        "text-xs font-medium",
        isActive
          ? [
              "bg-[var(--color-success-surface)]",
              "text-[var(--color-success-strong)]",
            ].join(" ")
          : [
              "bg-[var(--color-danger-surface)]",
              "text-[var(--color-danger-strong)]",
            ].join(" "),
      ].join(" ")}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
