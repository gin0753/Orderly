"use client";

import { ProductImage } from "@/components/ui/product-image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AdminProductImagePreviewProps {
  imageUrl: string;
  productName: string;
}

export function AdminProductImagePreview(props: AdminProductImagePreviewProps) {
  return <ImagePreviewContent key={props.imageUrl.trim()} {...props} />;
}

function ImagePreviewContent({
  imageUrl,
  productName,
}: AdminProductImagePreviewProps) {
  const normalizedImageUrl = imageUrl.trim();
  const normalizedProductName = productName.trim();

  const [retry, setRetry] = useState(0);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const didCurrentImageFail =
    normalizedImageUrl !== "" && failedImageUrl === normalizedImageUrl;

  const imageAlt = normalizedProductName
    ? `${normalizedProductName} preview`
    : "Product preview";

  function handleImageError() {
    setFailedImageUrl(normalizedImageUrl);
  }

  function handleRetry() {
    setFailedImageUrl(null);
    setRetry((value) => value + 1);
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <header
        className={["border-b border-[var(--color-border)]", "px-5 py-4"].join(
          " ",
        )}
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Image preview
        </h2>

        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Preview the customer-facing product image.
        </p>
      </header>

      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductImage
          key={retry}
          src={normalizedImageUrl}
          alt={imageAlt}
          sizes="(min-width: 1280px) 373px, (min-width: 1024px) calc(100vw - 66px), (min-width: 640px) calc(100vw - 50px), calc(100vw - 34px)"
          onError={handleImageError}
        />
      </div>

      {didCurrentImageFail ? (
        <div
          role="alert"
          className={[
            "flex flex-col gap-3",
            "border-t border-[var(--color-danger-border)]",
            "bg-[var(--color-danger-surface)]",
            "px-5 py-4",
            "sm:flex-row sm:items-center",
            "sm:justify-between",
          ].join(" ")}
        >
          <div>
            <p className="text-sm font-medium text-[var(--color-danger-strong)]">
              The image could not be loaded
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Check that the versioned image path matches an installed menu
              asset.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRetry}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}
