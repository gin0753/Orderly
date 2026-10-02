"use client";

import { ProductImage } from "@/components/ui/product-image";

interface AdminProductThumbnailProps {
  imageUrl: string | null;
}

export function AdminProductThumbnail({
  imageUrl,
}: AdminProductThumbnailProps) {
  return (
    <div
      className={[
        "relative h-12 w-12 shrink-0 overflow-hidden",
        "rounded-lg",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface-muted)]",
      ].join(" ")}
    >
      <ProductImage src={imageUrl} alt="" sizes="48px" />
    </div>
  );
}
