"use client";

import Image from "next/image";
import { useState } from "react";

interface AdminProductThumbnailProps {
  imageUrl: string | null;
}

function ProductImageFallback() {
  return (
    <div
      aria-hidden="true"
      className={[
        "flex h-full w-full items-center justify-center",
        "bg-[var(--color-surface-muted)]",
        "text-[var(--color-text-subtle)]",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m5 17 4.5-4.5 3 3 2-2L19 17" />
      </svg>
    </div>
  );
}

export function AdminProductThumbnail({
  imageUrl,
}: AdminProductThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div
      className={[
        "relative h-12 w-12 shrink-0 overflow-hidden",
        "rounded-lg",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface-muted)]",
      ].join(" ")}
    >
      {!imageUrl || hasImageError ? (
        <ProductImageFallback />
      ) : (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setHasImageError(true)}
        />
      )}
    </div>
  );
}
