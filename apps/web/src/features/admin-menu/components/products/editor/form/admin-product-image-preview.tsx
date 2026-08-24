"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AdminProductImagePreviewProps {
  imageUrl: string;
  productName: string;
}

function ImagePlaceholder() {
  return (
    <div
      className={[
        "flex h-full w-full min-h-48 flex-col",
        "items-center justify-center gap-2",
        "bg-[var(--color-surface-muted)]",
        "text-[var(--color-text-subtle)]",
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />

        <circle cx="8.5" cy="9" r="1.5" />

        <path d="m5 17 4.5-4.5 3 3 2-2L19 17" />
      </svg>

      <span className="text-sm">No image preview</span>
    </div>
  );
}

export function AdminProductImagePreview({
  imageUrl,
  productName,
}: AdminProductImagePreviewProps) {
  const normalizedImageUrl = imageUrl.trim();
  const normalizedProductName = productName.trim();

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
        {!normalizedImageUrl || didCurrentImageFail ? (
          <ImagePlaceholder />
        ) : (
          <Image
            key={normalizedImageUrl}
            src={normalizedImageUrl}
            alt={imageAlt}
            fill
            sizes={[
              "(min-width: 1280px) 30vw",
              "(min-width: 768px) 50vw",
              "100vw",
            ].join(", ")}
            className="object-cover"
            onError={handleImageError}
          />
        )}
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
              Check the image URL and ensure its host is allowed by the
              application.
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
