const audFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export function formatMoneyFromCents(priceCents: number) {
  return audFormatter.format(priceCents / 100);
}
