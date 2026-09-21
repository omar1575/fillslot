export function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function discountPercent(originalCents: number, dealCents: number) {
  if (originalCents <= 0) return 0;
  return Math.round(((originalCents - dealCents) / originalCents) * 100);
}

export function commissionFromGross(grossCents: number, commissionBps: number) {
  return Math.round((grossCents * commissionBps) / 10_000);
}
