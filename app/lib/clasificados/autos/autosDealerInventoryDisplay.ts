import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";

/** Neutral Leonix Autos placeholder when a listing has no hero image yet. */
export const AUTOS_LISTING_CARD_PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect fill='%23F5F0E8' width='800' height='500'/%3E%3Crect x='120' y='160' width='560' height='220' rx='28' fill='%23E8DFD0'/%3E%3Ctext x='400' y='295' text-anchor='middle' font-family='system-ui,sans-serif' font-size='28' fill='%238A8074'%3EAutos%3C/text%3E%3C/svg%3E";

export function resolveAutosListingCardImageUrl(url: string | undefined | null): string {
  const trimmed = url?.trim();
  return trimmed || AUTOS_LISTING_CARD_PLACEHOLDER_SRC;
}

export function sortDealerInventoryPublicListings(rows: AutosPublicListing[]): AutosPublicListing[] {
  return [...rows].sort((a, b) => {
    const yearDiff = (b.year ?? 0) - (a.year ?? 0);
    if (yearDiff !== 0) return yearDiff;
    const priceDiff = (a.price ?? 0) - (b.price ?? 0);
    if (priceDiff !== 0) return priceDiff;
    const aTs = a.publicSortTimestamp ? Date.parse(a.publicSortTimestamp) : 0;
    const bTs = b.publicSortTimestamp ? Date.parse(b.publicSortTimestamp) : 0;
    return bTs - aTs;
  });
}

export function autosDealerInventoryActiveCountLine(lang: "es" | "en", active: number, limit: number): string {
  return lang === "es"
    ? `${active} de ${limit} vehículos activos`
    : `${active} of ${limit} active vehicles`;
}

export function autosDealerInventoryRemainingSlotsLine(lang: "es" | "en", remaining: number): string {
  return lang === "es"
    ? `Te quedan ${remaining} espacios disponibles`
    : `You have ${remaining} slots remaining`;
}
