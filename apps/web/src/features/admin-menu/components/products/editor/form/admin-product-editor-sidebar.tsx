import { AdminProductImagePreview } from "./admin-product-image-preview";

interface AdminProductEditorSidebarProps {
  mode: "create" | "edit";
  productName: string;
  imageUrl: string;
}

export function AdminProductEditorSidebar({
  mode,
  productName,
  imageUrl,
}: AdminProductEditorSidebarProps) {
  const isEditMode = mode === "edit";

  return (
    <aside className="space-y-6">
      <AdminProductImagePreview imageUrl={imageUrl} productName={productName} />

      <section
        className={[
          "rounded-xl p-5",
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface)]",
        ].join(" ")}
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Publishing
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {isEditMode
            ? "Product availability is managed separately from its basic information."
            : "New products are created as available by default. Availability can be changed from the product list."}
        </p>
      </section>

      <section
        className={[
          "rounded-xl p-5",
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface)]",
        ].join(" ")}
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Sizes and add-ons
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          Option groups and product options will be configured in Stage 8.5E2.
        </p>
      </section>
    </aside>
  );
}
