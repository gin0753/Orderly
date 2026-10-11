import { ProductImage } from "@/components/ui/product-image";
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
  unavailable?: boolean;
};

export function CartItemRow({
  item,
  onRemove,
  onQuantityChange,
  unavailable = false,
}: CartItemRowProps) {
  const selectedOptionsText = getCartItemOptionSummary(item);

  return (
    <Card variant="surface" className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-4 p-4 sm:grid-cols-[80px_minmax(0,1fr)]">
      <div className="relative size-16 overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] sm:size-20">
        <ProductImage
          src={item.product.imageUrl}
          alt={item.product.name}
          sizes="(min-width: 640px) 80px, 64px"
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold leading-5 text-[var(--color-text-primary)]">
              {item.product.name}
            </h3>

            {selectedOptionsText ? (
              <p className="mt-2 break-words text-sm leading-5 text-[var(--color-text-secondary)]">
                {selectedOptionsText}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="-mr-2 -mt-2 size-11 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger-strong)]"
            aria-label={`Remove ${item.product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {unavailable ? <p className="col-span-2 rounded-[var(--radius-control)] bg-[var(--color-warning-surface)] p-3 text-sm leading-5 text-[var(--color-warning-strong)]">Item or selected option is currently unavailable. Review your cart; availability is confirmed at checkout.</p> : null}
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <QuantityStepper value={item.quantity} onChange={onQuantityChange} label={item.product.name} />

        <p className="text-base font-bold tabular-nums text-[var(--color-text-primary)]">
          {formatMoneyFromCents(item.unitPriceCents * item.quantity)}
        </p>
      </div>
    </Card>
  );
}
