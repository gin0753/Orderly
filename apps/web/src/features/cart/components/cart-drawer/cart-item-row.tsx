import Image from "next/image";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatMoneyFromCents } from "@/lib/format-money";

import type { CartItem } from "../../cart-types";
import { getCartItemOptionSummary } from "../../cart-utils";

type CartItemRowProps = {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
};

export function CartItemRow({
  item,
  onRemove,
  onQuantityChange,
}: CartItemRowProps) {
  const selectedOptionsText = getCartItemOptionSummary(item);

  return (
    <Card className="grid grid-cols-[72px_1fr] gap-4 border-[var(--color-border-soft)] p-3 shadow-none transition hover:border-[var(--color-border)]">
      <div className="relative h-[72px] w-[72px] overflow-hidden rounded-xl bg-[var(--color-surface-muted)]">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-subtle)]">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-bold text-[var(--color-text-primary)]">
              {item.product.name}
            </h3>

            {selectedOptionsText ? (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
                {selectedOptionsText}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="-mr-2 -mt-2 h-8 w-8 shrink-0 text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
            aria-label={`Remove ${item.product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <QuantityStepper value={item.quantity} onChange={onQuantityChange} />

          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            {formatMoneyFromCents(item.unitPriceCents * item.quantity)}
          </p>
        </div>
      </div>
    </Card>
  );
}
