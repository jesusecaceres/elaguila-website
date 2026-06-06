export const CAT_STD_PER_PAGE_OPTIONS = [12, 24, 48] as const;
export type CatStdPerPageOption = (typeof CAT_STD_PER_PAGE_OPTIONS)[number];
export const CAT_STD_DEFAULT_PER_PAGE: CatStdPerPageOption = 12;

export function parseCatStdPerPage(raw: string | null | undefined): CatStdPerPageOption {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (n === 12 || n === 24 || n === 48) return n;
  return CAT_STD_DEFAULT_PER_PAGE;
}

export function catStdPerPageToParam(perPage: number): string | undefined {
  return perPage === CAT_STD_DEFAULT_PER_PAGE ? undefined : String(perPage);
}

export function parseCatStdPage(raw: string | null | undefined): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
