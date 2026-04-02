export function formatUsd(n: number): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMiles(n: number): string {
  return `${new Intl.NumberFormat("es-US").format(n)} mi`;
}
