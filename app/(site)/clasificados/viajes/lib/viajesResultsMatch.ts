import type { ViajesBrowseState } from "./viajesBrowseContract";
import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import { viajesRowMatchesTripParam } from "../data/viajesTripTypes";

function textHaystack(row: ViajesResultRow): string {
  if (row.kind === "affiliate") return `${row.title} ${row.destination} ${row.priceFrom}`.toLowerCase();
  if (row.kind === "business")
    return `${row.offerTitle} ${row.destination} ${row.departureCity} ${row.price} ${row.includedSummary}`.toLowerCase();
  return `${row.title} ${row.dek} ${row.destinationLabel}`.toLowerCase();
}

function rowServiceLanguageKeys(row: ViajesResultRow): string[] {
  if (row.kind === "affiliate" || row.kind === "business") return row.serviceLanguageKeys ?? [];
  return [];
}

function matchesSvcLangFilter(row: ViajesResultRow, svcLang: string): boolean {
  const need = svcLang.trim();
  if (!need) return true;
  if (row.kind === "editorial") return true;
  const keys = rowServiceLanguageKeys(row);
  if (!keys.length) return false;
  if (need === "bilingual") {
    return keys.includes("bilingual") || (keys.includes("es") && keys.includes("en"));
  }
  return keys.includes(need);
}

function destSlugMatch(row: ViajesResultRow, slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s) return true;
  const slugs = row.destSlugs?.map((x) => x.toLowerCase()) ?? [];
  if (slugs.includes(s)) return true;
  const hay = textHaystack(row);
  const dashed = s.replace(/-/g, " ");
  return hay.includes(s) || hay.includes(dashed);
}

function queryTextMatch(row: ViajesResultRow, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return textHaystack(row).includes(t);
}

const FROM_MAP: Record<string, string[]> = {
  "san-jose": ["sjo", "san josé", "san jose", "sjc"],
  "san-francisco": ["san francisco", "sfo"],
  oakland: ["oakland", "oak"],
};

function departureMatches(row: ViajesResultRow, from: string): boolean {
  const f = from.trim();
  if (row.kind === "editorial") return true;
  if (!f) return true;
  let dep = "";
  if (row.kind === "affiliate") dep = row.departureContext.toLowerCase();
  else if (row.kind === "business") dep = row.departureCity.toLowerCase();
  const needles = FROM_MAP[f] ?? [f.replace(/-/g, " ")];
  return needles.some((n) => dep.includes(n));
}

/**
 * Note: `browse.zip`, `browse.radiusMiles`, and `browse.nearMe` are **not** applied here until
 * inventory + API support geo-radius / postal matching — see `viajesBrowseContract.ts`.
 */
export function viajesRowMatchesBrowse(row: ViajesResultRow, browse: ViajesBrowseState): boolean {
  const slug = browse.dest.trim();
  const q = browse.q.trim();
  if (slug) {
    if (!destSlugMatch(row, slug)) return false;
  } else if (q) {
    if (!queryTextMatch(row, q)) return false;
  }

  if (!departureMatches(row, browse.from)) return false;

  if (browse.t && !viajesRowMatchesTripParam(row.tripTypeKeys, browse.t)) return false;

  if (browse.budget && row.kind !== "editorial") {
    const band = row.budgetBand?.trim() ?? "";
    if (!band || band !== browse.budget) return false;
  }

  if (browse.audience) {
    const keys = row.audienceKeys ?? [];
    if (!keys.includes(browse.audience)) return false;
  }

  if (browse.season) {
    const sk = row.seasonKeys ?? [];
    if (!sk.includes(browse.season)) return false;
  }

  if (browse.duration) {
    const dk = row.durationKey?.trim() ?? "";
    if (!dk || dk !== browse.duration) return false;
  }

  if (!matchesSvcLangFilter(row, browse.svcLang)) return false;

  return true;
}
