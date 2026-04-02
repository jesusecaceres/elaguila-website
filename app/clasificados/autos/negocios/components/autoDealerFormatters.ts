export function formatUsd(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMiles(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return `${new Intl.NumberFormat("es-US").format(n)} mi`;
}
