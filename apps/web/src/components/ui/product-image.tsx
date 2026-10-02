"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { isProductImagePath } from "@/lib/product-image-path";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  onError?: () => void;
};

// The keyed child resets errors on every source change, including A -> B -> A.
export function ProductImage(props: ProductImageProps) {
  return <ProductImageContent key={props.src ?? ""} {...props} />;
}

function ProductImageContent({
  src,
  alt,
  sizes,
  className = "object-cover",
  priority,
  onError,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || !isProductImagePath(src) || failed) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt ? `${alt} — image unavailable` : undefined}
        aria-hidden={alt ? undefined : true}
        className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]"
      >
        <ImageIcon aria-hidden="true" className="h-6 w-6" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
}
