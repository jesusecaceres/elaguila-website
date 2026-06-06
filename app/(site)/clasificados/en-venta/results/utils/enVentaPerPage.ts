export const EN_VENTA_PER_PAGE_OPTIONS = [12, 24, 48] as const;
export type EnVentaPerPageOption = (typeof EN_VENTA_PER_PAGE_OPTIONS)[number];
export const EN_VENTA_DEFAULT_PER_PAGE: EnVentaPerPageOption = 12;

export function parseEnVentaPerPage(raw: string | null | undefined): EnVentaPerPageOption {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (n === 12 || n === 24 || n === 48) return n;
  return EN_VENTA_DEFAULT_PER_PAGE;
}

export function enVentaPerPageToParam(perPage: number): string | undefined {
  return perPage === EN_VENTA_DEFAULT_PER_PAGE ? undefined : String(perPage);
}
