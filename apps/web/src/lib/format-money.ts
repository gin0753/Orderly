export function formatMoneyFromCents(amountCents: number) {
  if (!Number.isFinite(amountCents)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amountCents / 100);
}
