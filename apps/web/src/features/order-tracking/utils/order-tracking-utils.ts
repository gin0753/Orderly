export function normaliseOrderNumber(value: string) {
  return value.trim().replace(/^#/, "");
}

export function formatMoneyFromCents(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value / 100);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
