export function formatAutosUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatAutosMiles(n: number): string {
  return `${new Intl.NumberFormat("en-US").format(Math.round(n))} mi`;
}

export function formatAutosLocation(city: string, state: string): string {
  return `${city}, ${state}`;
}
