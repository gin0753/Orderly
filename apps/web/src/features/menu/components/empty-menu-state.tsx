export function EmptyMenuState() {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        No menu items yet
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
        Menu categories and products will appear here once they are added from
        the backend.
      </p>
    </div>
  );
}
