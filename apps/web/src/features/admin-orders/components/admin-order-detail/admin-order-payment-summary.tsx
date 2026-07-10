import { formatMoneyFromCents } from "@/lib/format-money";
import { AdminOrder } from "../../types";

type AdminOrderPaymentSummaryProps = {
  order: AdminOrder;
};

const paymentSummaryRows: Array<{
  label: string;
  value: "subtotalCents" | "deliveryFeeCents" | "serviceFeeCents";
}> = [
  { label: "Subtotal", value: "subtotalCents" },
  { label: "Delivery fee", value: "deliveryFeeCents" },
  { label: "Service fee", value: "serviceFeeCents" },
];

export function AdminOrderPaymentSummary({
  order,
}: AdminOrderPaymentSummaryProps) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold">Payment Summary</h3>

      <div className="space-y-2 rounded-2xl border border-[var(--color-border)] p-4 text-sm">
        {paymentSummaryRows.map((item) => (
          <div className="flex justify-between" key={item.value}>
            <span className="text-[var(--color-text-secondary)]">
              {item.label}
            </span>

            <span>{formatMoneyFromCents(order[item.value])}</span>
          </div>
        ))}

        {typeof order.serviceFeeCents === "number" ? (
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Tax</span>
            <span>{formatMoneyFromCents(order.serviceFeeCents)}</span>
          </div>
        ) : null}

        <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatMoneyFromCents(order.totalCents)}</span>
        </div>
      </div>
    </section>
  );
}
