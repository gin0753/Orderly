export function moneyToCents(value: unknown) {
  return Math.round(Number(value) * 100);
}
